import React from "react"

type WeatherIconProps = {
  weather?: number | string | null
  size?: "small" | "large"
}

export function WeatherIcon({ weather, size = "small" }: WeatherIconProps) {
  if (weather === null || weather === undefined || weather === "") {
    return null
  }

  const count = Number(weather)

  if (!Number.isInteger(count) || count < 0 || count > 5) {
    return null
  }

  const title = `${count} of the last 5 builds were successful`
  const dotSize = size === "large" ? "h-3 w-3" : "h-2.5 w-2.5"

  return React.createElement(
    "span",
    { className: "inline-flex items-center gap-1", title, "aria-label": title },
    Array.from({ length: 5 }, (_, index) =>
      React.createElement("span", {
        key: index,
        className: `${dotSize} rounded-full ${index < count ? "bg-green-500" : "bg-gray-200"}`,
      })
    )
  )
}
