import { BuildList } from "components/builds/BuildList"
import { h } from "lib/h"

export function BuildQueueWidget({ builds }) {
  return h(
    "section",
    null,
    h("h2", null, "Build queue"),
    h(BuildList, { builds })
  )
}

