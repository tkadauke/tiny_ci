import { BuildList } from "components/builds/BuildList"
import { h } from "lib/h"

export function RecentBuildsWidget({ builds }) {
  return h(
    "section",
    null,
    h("h2", null, "Recently finished builds"),
    h(BuildList, { builds, showDuration: true, showStopAction: false })
  )
}

