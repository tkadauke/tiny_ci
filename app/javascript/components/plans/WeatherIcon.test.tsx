import { render, screen } from "@testing-library/react";
import { WeatherIcon } from "./WeatherIcon";

test.each([0, 1, 2, 3, 4, 5])("renders the correct icon src for weather %i", (weather) => {
  render(<WeatherIcon weather={weather} />);

  expect(screen.getByRole("img")).toHaveAttribute(
    "src",
    `/assets/icons/small/weather-${weather}.png`,
  );
});
