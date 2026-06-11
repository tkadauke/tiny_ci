import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@/test/test-utils";
import { renderWithProviders } from "@/test/test-utils";
import PlanForm, { emptyPlanFormValues } from "./PlanForm";

describe("PlanForm", () => {
  it("renders all editable plan fields and validation errors", () => {
    renderWithProviders(
      <PlanForm
        values={emptyPlanFormValues({ name: "main" })}
        canEditPlans
        rootPlanOptions={[{ id: 1, name: "release" }]}
        errors={["Name is invalid"]}
        submitting={false}
        submitLabel="Create"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Name")).toHaveValue("main");
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Repository URL")).toBeInTheDocument();
    expect(screen.getByLabelText("Steps")).toBeInTheDocument();
    expect(screen.getByLabelText("Plan requirements")).toBeInTheDocument();
    expect(screen.getByLabelText("Run this plan after")).toBeInTheDocument();
    expect(screen.getByText("Name is invalid")).toBeInTheDocument();
  });

  it("passes changed values to handlers before submit", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onSubmit = vi.fn((event) => event.preventDefault());

    renderWithProviders(
      <PlanForm
        values={emptyPlanFormValues()}
        canEditPlans
        rootPlanOptions={[]}
        errors={[]}
        submitting={false}
        submitLabel="Update"
        onChange={onChange}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText("Name"), "main");
    await user.click(screen.getByRole("button", { name: "Update" }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ name: "m" }));
    expect(onSubmit).toHaveBeenCalled();
  });
});
