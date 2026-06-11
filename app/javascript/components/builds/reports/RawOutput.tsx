import React from "react"
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
  if (!rows.length) return <p>No output (yet)</p>

  let lastCommand: string | undefined
  let lastTimestamp: number | undefined

  return (
    <div className="raw-output">
      <table>
        <tbody>
          {rows.map((row) => {
            const timestamp = Math.trunc(Number(row.timestamp))
            const showTimestamp = timestamp !== lastTimestamp
            const showCommand = row.command !== lastCommand
            lastTimestamp = timestamp
            lastCommand = row.command

            return (
              <tr key={row.index}>
                <td className="row">{row.index}</td>
                <td className="timestamp">{showTimestamp ? timeText(row.timestamp) : ""}</td>
                <td className="command">{showCommand ? row.command : ""}</td>
                <td className="line">{row.line}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
