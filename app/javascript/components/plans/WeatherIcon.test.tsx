import { render, screen } from "@testing-library/react";
import { WeatherIcon } from "./WeatherIcon";

test.each([0, 1, 2, 3, 4, 5])("renders the weather dot meter for weather %i", (weather) => {
  render(<WeatherIcon weather={weather} />);

  expect(screen.getByLabelText(`${weather} of the last 5 builds were successful`)).toBeInTheDocument();
});
