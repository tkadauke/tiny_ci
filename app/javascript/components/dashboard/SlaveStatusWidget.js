import { BuildList } from "components/builds/BuildList"
import { BuildStatusIcon } from "components/builds/BuildStatusIcon"
import { h } from "lib/h"

function SlaveStatus({ slave }) {
  if (slave.offline) {
    return h(
      "p",
      null,
      h(BuildStatusIcon, { status: "offline", label: "Slave is offline." }),
      " ",
      h("a", { href: `/admin/slaves/${slave.name}/edit` }, "Configure")
    )
  }

  return h(BuildList, { builds: slave.running_builds || [] })
}

export function SlaveStatusWidget({ slaves }) {
  if (slaves.length === 0) {
    return h(
      "section",
      null,
      h("h2", null, "Slave status"),
      h("p", null, "No slaves configured. ", h("a", { href: "/admin/slaves" }, "Configure them now"))
    )
  }

  return h(
    "section",
    null,
    h("h2", null, "Slave status"),
    h(
      "ul",
      null,
      slaves.map((slave) =>
        h(
          "li",
          { key: slave.name },
          h("p", null, h("strong", null, slave.name)),
          h(SlaveStatus, { slave })
        )
      )
    )
  )
}

