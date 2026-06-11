import React from "react"
import { h } from "lib/h"

export function QuickLinks({ currentUser }) {
  let accountLink

  if (currentUser.initialAdmin) {
    accountLink = ["Create first administrator account", "/users/new"]
  } else if (currentUser.loggedIn && currentUser.canCreateAccounts) {
    accountLink = ["Create accounts", "/users/new"]
  } else {
    accountLink = ["Sign up", "/users/new"]
  }

  return h(
    React.Fragment,
    null,
    h("h2", null, "Quick links"),
    h(
      "ul",
      { className: "asterisk" },
      h("li", null, h("a", { href: accountLink[1] }, accountLink[0])),
      h("li", null, h("a", { href: "/projects/new" }, "Create a project")),
      h("li", null, h("a", { href: "/admin/slaves" }, "Manage build slaves"))
    )
  )
}
