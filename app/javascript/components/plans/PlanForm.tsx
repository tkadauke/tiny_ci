import React, { ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { FormField, inputClassName } from "@/components/ui/FormField";

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
    <Card>
      <CardBody>
    <form onSubmit={onSubmit}>
      {errors.length > 0 ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-medium">{errors.length} prohibited this plan from being saved</p>
          <ul className="mt-2 list-disc pl-5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <input type="hidden" name="plan[parent_id]" value={values.parent_id ?? ""} />

      <FormField label="Name">
        <input className={inputClassName} id={fieldId("name")} name="plan[name]" type="text" value={values.name} onChange={updateText("name")} />
      </FormField>
      <p className="-mt-2 mb-4 text-sm text-gray-500">
          The plan&apos;s name will appear in the URL. Changes to the name will change all URLs for this plan. Only
          characters, numbers, underscores and dashes are allowed in the name.
      </p>

      <FormField label="Description">
        <textarea
          className={inputClassName}
          id={fieldId("description")}
          name="plan[description]"
          rows={5}
          value={values.description}
          onChange={updateText("description")}
        />
      </FormField>

      <FormField label="Repository URL">
        <input
          className={inputClassName}
          id={fieldId("repository_url")}
          name="plan[repository_url]"
          type="text"
          value={values.repository_url}
          onChange={updateText("repository_url")}
        />
      </FormField>

      {canEditPlans ? (
        <>
        <FormField label="Steps">
          <textarea className={`${inputClassName} font-mono`} id={fieldId("steps")} name="plan[steps]" rows={10} value={values.steps} onChange={updateText("steps")} />
        </FormField>
        <p className="-mt-2 mb-4 text-sm text-gray-500">
            Steps necessary to build the plan. <a href="/help_topics/plan">Help</a>
        </p>
        </>
      ) : null}

      <FormField label="Plan requirements">
        <textarea
          className={inputClassName}
          id={fieldId("requirements")}
          name="plan[requirements]"
          rows={3}
          value={values.requirements}
          onChange={updateText("requirements")}
        />
      </FormField>
      <p className="-mt-2 mb-4 text-sm text-gray-500">
          Capabilities a build worker must have to build this plan, separated by commas.{" "}
          <a href="/help_topics/workers">Help</a>
      </p>

      {!hasParent ? (
        <>
          <h2 className="mb-3 mt-6 text-base font-semibold text-gray-900">Run this plan after</h2>

          <FormField label="Run this plan after">
            <select
              className={inputClassName}
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
          </FormField>
        </>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? `${submitLabel}...` : submitLabel}
        </Button>
        <button type="button" className="text-sm text-gray-600 hover:text-gray-900" onClick={() => window.history.back()}>
          Cancel
        </button>
      </div>
    </form>
      </CardBody>
    </Card>
  );
}
