import { h } from "lib/h"
import { statusIconPath } from "lib/assets"

const STATUS_LABELS = {
  canceled: "Canceled",
  error: "Error",
  failure: "Failure",
  offline: "Offline",
  pending: "Pending",
  running: "Running",
  stopped: "Stopped",
  stopping: "Stopping",
  success: "Success",
  waiting: "Waiting",
}

export function statusText(status) {
  return STATUS_LABELS[status] || status
}

export function BuildStatusIcon({ status, label }) {
  const text = label || statusText(status)

  return h(
    "span",
    { className: "build-status" },
    h("img", { src: statusIconPath(status), alt: text }),
    " ",
    text
  )
}
