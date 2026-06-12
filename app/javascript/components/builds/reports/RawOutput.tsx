import React from "react"
import { useTranslation } from "react-i18next"
import type { OutputRow } from "@/hooks/useBuild"

type Props = {
  rows: OutputRow[]
}

function timeText(timestamp: number) {
  return new Date(Number(timestamp) * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

export function RawOutput({ rows }: Props) {
  const { t } = useTranslation()

  if (!rows.length) return <p>{t("builds.report.no_output_yet")}</p>

  let lastCommand: string | undefined
  let lastTimestamp: number | undefined
  let commandIndex = -1

  return (
    <pre className="overflow-x-auto rounded-lg bg-gray-950 p-4 font-mono text-xs leading-5 text-gray-100">
      {rows.map((row) => {
        const timestamp = Math.trunc(Number(row.timestamp))
        const showTimestamp = timestamp !== lastTimestamp
        const showCommand = row.command !== lastCommand
        if (showCommand) commandIndex += 1
        lastTimestamp = timestamp
        lastCommand = row.command

        return (
          <div key={row.index} role="row" className={commandIndex % 2 === 0 ? "bg-gray-950" : "bg-gray-900/70"}>
            <span className="inline-block w-12 select-none text-gray-500">{row.index}</span>
            <span className="timestamp inline-block w-20 select-none text-gray-500">{showTimestamp ? timeText(row.timestamp) : ""}</span>
            <span className="command inline-block w-40 select-none truncate pr-4 text-gray-400">{showCommand ? row.command : ""}</span>
            <span>{row.line}</span>
          </div>
        )
      })}
    </pre>
  )
}
