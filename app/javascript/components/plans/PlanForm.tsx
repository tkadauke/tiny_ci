import React, { ChangeEvent, FormEvent } from "react";

export type Reference = {
  id: number;
  name: string;
};

export type PlanFormValues = {
  name: string;
  description: string;
  repository_url: string;
  steps: string;
  requirements: string;
  parent_id: number | null;
  previous_plan_id: number | null;
};

type PlanFormProps = {
  values: PlanFormValues;
  canEditPlans: boolean;
  rootPlanOptions: Reference[];
  errors: string[];
  submitting: boolean;
  submitLabel: string;
  onChange: (values: PlanFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function fieldId(name: keyof PlanFormValues) {
  return `plan_${name}`;
}

function numberFromSelect(value: string) {
  return value === "" ? null : Number(value);
}

export function emptyPlanFormValues(overrides: Partial<PlanFormValues> = {}): PlanFormValues {
  return {
    name: "",
    description: "",
    repository_url: "",
    steps: "",
    requirements: "",
    parent_id: null,
    previous_plan_id: null,
    ...overrides,
  };
}

export default function PlanForm({
  values,
  canEditPlans,
  rootPlanOptions,
  errors,
  submitting,
  submitLabel,
  onChange,
  onSubmit,
}: PlanFormProps) {
  function updateText(field: keyof PlanFormValues) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange({ ...values, [field]: event.target.value });
    };
  }

  function updatePreviousPlan(event: ChangeEvent<HTMLSelectElement>) {
    onChange({ ...values, previous_plan_id: numberFromSelect(event.target.value) });
  }

  const hasParent = values.parent_id !== null;

  return (
    <form onSubmit={onSubmit}>
      {errors.length > 0 ? (
        <div className="errorExplanation">
          <h2>{errors.length} prohibited this plan from being saved</h2>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <input type="hidden" name="plan[parent_id]" value={values.parent_id ?? ""} />

      <p className="form_item">
        <span className="label">
          <label htmlFor={fieldId("name")}>Name</label>
        </span>
        <span className="desc">
          The plan&apos;s name will appear in the URL. Changes to the name will change all URLs for this plan. Only
          characters, numbers, underscores and dashes are allowed in the name.
        </span>
        <input id={fieldId("name")} name="plan[name]" type="text" value={values.name} onChange={updateText("name")} />
      </p>

      <p className="form_item">
        <span className="label">
          <label htmlFor={fieldId("description")}>Description</label>
        </span>
        <textarea
          id={fieldId("description")}
          name="plan[description]"
          rows={5}
          value={values.description}
          onChange={updateText("description")}
        />
      </p>

      <p className="form_item">
        <span className="label">
          <label htmlFor={fieldId("repository_url")}>Repository URL</label>
        </span>
        <input
          id={fieldId("repository_url")}
          name="plan[repository_url]"
          type="text"
          value={values.repository_url}
          onChange={updateText("repository_url")}
        />
      </p>

      {canEditPlans ? (
        <p className="form_item">
          <span className="label">
            <label htmlFor={fieldId("steps")}>Steps</label>
          </span>
          <span className="desc">
            Steps necessary to build the plan. <a href="/help_topics/plan">Help</a>
          </span>
          <textarea id={fieldId("steps")} name="plan[steps]" rows={10} value={values.steps} onChange={updateText("steps")} />
        </p>
      ) : null}

      <p className="form_item">
        <span className="label">
          <label htmlFor={fieldId("requirements")}>Plan requirements</label>
        </span>
        <span className="desc">
          Capabilities a build worker must have to build this plan, separated by commas.{" "}
          <a href="/help_topics/workers">Help</a>
        </span>
        <textarea
          id={fieldId("requirements")}
          name="plan[requirements]"
          rows={3}
          value={values.requirements}
          onChange={updateText("requirements")}
        />
      </p>

      {!hasParent ? (
        <>
          <h2>Run this plan after</h2>

          <p className="form_item">
            <span className="label">
              <label htmlFor={fieldId("previous_plan_id")}>Run this plan after</label>
            </span>
            <select
              id={fieldId("previous_plan_id")}
              name="plan[previous_plan_id]"
              value={values.previous_plan_id ?? ""}
              onChange={updatePreviousPlan}
            >
              <option value="" />
              {rootPlanOptions.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </p>
        </>
      ) : null}

      <button type="submit" disabled={submitting}>
        {submitLabel}
      </button>
    </form>
  );
}
