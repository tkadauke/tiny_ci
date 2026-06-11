import React from "react"

const h = React.createElement

function timeText(timestamp) {
  return new Date(Number(timestamp) * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

export function RawOutput({ rows }) {
  if (!rows.length) return h("p", null, "No output (yet)")

  let lastCommand
  let lastTimestamp

  return h("div", { className: "raw-output" },
    h("table", null,
      h("tbody", null,
        rows.map((row) => {
          const timestamp = Math.trunc(Number(row.timestamp))
          const showTimestamp = timestamp !== lastTimestamp
          const showCommand = row.command !== lastCommand
          lastTimestamp = timestamp
          lastCommand = row.command

          return h("tr", { key: row.index },
            h("td", { className: "row" }, row.index),
            h("td", { className: "timestamp" }, showTimestamp ? timeText(row.timestamp) : ""),
            h("td", { className: "command" }, showCommand ? row.command : ""),
            h("td", { className: "line" }, row.line),
          )
        })
      )
    )
  )
}
