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

  return React.createElement("img", {
    src: `/assets/icons/${size}/weather-${count}.png`,
    title,
    alt: title
  })
}
