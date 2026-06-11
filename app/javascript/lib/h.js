import React from "react"

export function h(type, props, ...children) {
  return React.createElement(type, props, ...children)
}

