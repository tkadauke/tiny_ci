import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FlashMessage, { FlashProvider, useFlash } from "./FlashMessage";

function FlashSetter() {
  const { setFlash } = useFlash();

  return (
    <button type="button" onClick={() => setFlash({ type: "notice", message: "Saved" })}>
      Set flash
    </button>
  );
}

test("FlashProvider renders children", () => {
  render(
    <FlashProvider>
      <p>Child content</p>
    </FlashProvider>,
  );

  expect(screen.getByText("Child content")).toBeInTheDocument();
});

test("useFlash and setFlash cause the message to appear in the DOM", async () => {
  const user = userEvent.setup();
  render(
    <FlashProvider>
      <FlashSetter />
      <FlashMessage />
    </FlashProvider>,
  );

  await user.click(screen.getByRole("button", { name: "Set flash" }));

  expect(screen.getByRole("alert")).toHaveTextContent("Saved");
});

test("close link removes the message", async () => {
  const user = userEvent.setup();
  render(
    <FlashProvider>
      <FlashSetter />
      <FlashMessage />
    </FlashProvider>,
  );

  await user.click(screen.getByRole("button", { name: "Set flash" }));
  await user.click(screen.getByRole("button", { name: "Close" }));

  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
