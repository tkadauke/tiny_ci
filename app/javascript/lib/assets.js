let statusIcons = {}

export function setStatusIcons(icons) {
  statusIcons = icons || {}
}

export function statusIconPath(status) {
  return statusIcons[status] || `/assets/icons/small/${status}.png`
}

