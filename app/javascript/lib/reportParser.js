const TEST_TASKS = new Set(["test", "test:units", "test:functionals"])
const TEST_STATUSES = { ".": "success", F: "failure", E: "error" }

class RowCursor {
  constructor(rows) {
    this.rows = rows
    this.offset = 0
    this.consumed = []
  }

  empty() {
    return this.offset >= this.rows.length
  }

  peek() {
    return this.rows[this.offset]
  }

  consume() {
    const row = this.rows[this.offset++]
    if (row) this.consumed.push(row)
    return row
  }

  consumedRows() {
    return this.consumed
  }
}

export function parseReports(rows) {
  return splitByCommand(rows).flatMap((part) => {
    const command = part[0]?.command
    if (command === "rake") return [parseRake(part)]
    if (command === "cap") return [parseCapistrano(part)]
    return []
  })
}

function splitByCommand(rows) {
  if (!rows.length) return []

  const parts = []
  let currentCommand = rows[0].command
  let currentRows = []

  rows.forEach((row) => {
    if (row.command !== currentCommand) {
      parts.push(currentRows)
      currentRows = []
      currentCommand = row.command
    }
    currentRows.push(row)
  })

  if (currentRows.length) parts.push(currentRows)
  return parts
}

function parseRake(rows) {
  const cursor = new RowCursor(rows)
  const report = { type: "build", buildTool: "rake", targets: "", tasks: [], rawOutput: [] }

  while (!cursor.empty()) {
    const line = cursor.consume()?.line || ""
    const match = line.match(/^\*\* Execute (.*)$/)
    if (!match) continue

    const task = TEST_TASKS.has(match[1]) ? parseRakeTest(cursor) : parseRakeTask(cursor)
    task.name = match[1]
    report.tasks.push(task)
  }

  report.rawOutput = cursor.consumedRows()
  return report
}

function parseRakeTask(cursor) {
  const report = { type: "task", name: "", rawOutput: [] }
  const start = cursor.consumedRows().length

  while (!cursor.empty() && !/\*\* (Execute|Invoke)/.test(cursor.peek().line)) {
    cursor.consume()
  }

  report.rawOutput = cursor.consumedRows().slice(start)
  return report
}

function parseRakeTest(cursor) {
  const report = {
    type: "test",
    name: "",
    summary: { totalTime: "", tests: "", assertions: "", failures: "", errors: "" },
    tests: [],
    rawOutput: [],
  }
  const start = cursor.consumedRows().length
  const testsByName = new Map()
  let lastTest
  let lastTimestamp

  while (!cursor.empty() && !/\*\* (Execute|Invoke)/.test(cursor.peek().line)) {
    const row = cursor.consume()
    if (!row) break

    if (lastTest && lastTimestamp !== undefined) {
      lastTest.duration = Number(row.timestamp) - lastTimestamp
      lastTest = undefined
      lastTimestamp = undefined
    }

    const testMatch = row.line.match(/(test_[a-zA-Z0-9_]*)\((.*?)\):\s+([.FE])/)
    const timeMatch = row.line.match(/Finished in (.*?) seconds\./)
    const summaryMatch = row.line.match(/(\d+) tests, (\d+) assertions, (\d+) failures, (\d+) errors/)

    if (testMatch) {
      lastTest = addTestCase(testsByName, testMatch[2], testMatch[1], TEST_STATUSES[testMatch[3]])
      lastTimestamp = Number(row.timestamp)
    } else if (timeMatch) {
      report.summary.totalTime = timeMatch[1]
    } else if (summaryMatch) {
      report.summary.tests = summaryMatch[1]
      report.summary.assertions = summaryMatch[2]
      report.summary.failures = summaryMatch[3]
      report.summary.errors = summaryMatch[4]
    } else if (/^\d+\) Error:$/.test(row.line)) {
      parseTestError(cursor, testsByName)
    } else if (/^\d+\) Failure:$/.test(row.line)) {
      parseTestFailure(cursor, testsByName)
    }
  }

  report.tests = Array.from(testsByName.values())
  report.rawOutput = cursor.consumedRows().slice(start)
  return report
}

function addTestCase(testsByName, testName, testCaseName, status) {
  let test = testsByName.get(testName)
  if (!test) {
    test = { name: testName, testCases: [] }
    testsByName.set(testName, test)
  }

  const testCase = { name: testCaseName, status }
  test.testCases.push(testCase)
  return testCase
}

function findTestCase(testsByName, testName, testCaseName) {
  return testsByName.get(testName)?.testCases.find((testCase) => testCase.name === testCaseName)
}

function parseTestError(cursor, testsByName) {
  const testLine = cursor.consume()?.line || ""
  const match = testLine.match(/(test_[a-zA-Z0-9_]*)\((.*?)\)/)
  if (!match) return

  const errorMessage = cursor.consume()?.line || ""
  const backtrace = []

  while (!cursor.empty() && cursor.peek().line !== "") {
    backtrace.push(cursor.consume().line.split(":"))
  }

  const testCase = findTestCase(testsByName, match[2], match[1])
  if (testCase) {
    testCase.errorMessage = errorMessage
    testCase.backtrace = backtrace
  }
}

function parseTestFailure(cursor, testsByName) {
  const testLine = cursor.consume()?.line || ""
  const match = testLine.match(/(test_[a-zA-Z0-9_]*)\((.*?)\)/)
  if (!match) return

  const backtrace = []
  while (!cursor.empty() && cursor.peek().line !== "") {
    const line = cursor.consume().line
    backtrace.push(line.replace(/^\[/, "").replace(/\]:$/, "").split(":"))
    if (/\]:$/.test(line)) break
  }

  const errorMessage = []
  while (!cursor.empty() && cursor.peek().line !== "") {
    errorMessage.push(cursor.consume().line)
  }

  const testCase = findTestCase(testsByName, match[2], match[1])
  if (testCase) {
    testCase.errorMessage = errorMessage.join(" ")
    testCase.backtrace = backtrace
  }
}

function parseCapistrano(rows) {
  const cursor = new RowCursor(rows)
  const report = { type: "deploy", deployTool: "cap", targets: "", tasks: [], rawOutput: [] }

  while (!cursor.empty()) {
    const line = cursor.consume()?.line || ""
    const match = line.match(/^\s*\* executing `(.*?)'$/)
    if (!match) continue

    const task = parseCapistranoTask(cursor)
    task.name = match[1]
    report.tasks.push(task)
  }

  report.rawOutput = cursor.consumedRows()
  return report
}

function parseCapistranoTask(cursor) {
  const report = { type: "deployTask", name: "", commands: [] }

  while (!cursor.empty()) {
    const line = cursor.peek().line
    const commandMatch = line.match(/^\s*\* executing "(.*)"$/)

    if (commandMatch) {
      cursor.consume()
      const command = parseCapistranoCommand(cursor)
      command.command = commandMatch[1]
      report.commands.push(command)
    } else if (/^\s*\* executing `(.*?)'$/.test(line)) {
      return report
    } else {
      cursor.consume()
    }
  }

  return report
}

function parseCapistranoCommand(cursor) {
  const report = { type: "deployCommand", command: "", output: {} }
  let lastServer
  let lastChannel

  while (!cursor.empty()) {
    const line = cursor.consume()?.line || ""
    const serverFirst = line.match(/^\s*\*\* \[(.*?) :: (out|err)\] (.*)$/)
    const channelFirst = line.match(/^\s*\*\* \[(out|err) :: (.*?)\] (.*)$/)
    const continuation = line.match(/^\s*\*\* (.*)$/)

    if (serverFirst) {
      lastServer = serverFirst[1]
      lastChannel = serverFirst[2]
      addDeployOutput(report, lastServer, lastChannel, serverFirst[3])
    } else if (channelFirst) {
      lastChannel = channelFirst[1]
      lastServer = channelFirst[2]
      addDeployOutput(report, lastServer, lastChannel, channelFirst[3])
    } else if (continuation && lastServer) {
      addDeployOutput(report, lastServer, lastChannel || null, continuation[1])
    } else if (/command finished/.test(line)) {
      return report
    }
  }

  return report
}

function addDeployOutput(report, server, channel, string) {
  report.output[server] ||= []
  report.output[server].push({ channel, string })
}
