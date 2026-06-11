import React, { FormEvent, useEffect, useMemo, useState } from "react";
import PlanForm, { Reference, emptyPlanFormValues, PlanFormValues } from "../../components/plans/PlanForm";

type NewPlanPageProps = {
  projectId?: string;
};

type PlanFormPayload = {
  plan: Partial<PlanFormValues>;
  can_edit_plans: boolean;
  root_plan_options: Reference[];
};

type PlanResponse = {
  name: string;
  project: Reference;
};

type ApiError = {
  errors?: string[];
};

function encodePathPart(value: string) {
  return encodeURIComponent(value);
}

function parseProjectId() {
  const match = window.location.pathname.match(/^\/projects\/([^/]+)\/plans\/new/);
  return match ? decodeURIComponent(match[1]) : "";
}

function apiHeaders() {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));

  if (response.ok) return body as T;

  const errors = (body as ApiError).errors;
  throw new Error(errors && errors.length > 0 ? errors.join("\n") : `${response.status} ${response.statusText}`);
}

function valuesFromPayload(payload: PlanFormPayload) {
  return emptyPlanFormValues({
    name: payload.plan.name ?? "",
    description: payload.plan.description ?? "",
    repository_url: payload.plan.repository_url ?? "",
    steps: payload.plan.steps ?? "",
    requirements: payload.plan.requirements ?? "",
    parent_id: payload.plan.parent_id ?? null,
    previous_plan_id: payload.plan.previous_plan_id ?? null,
  });
}

function planPath(projectId: string, planName: string) {
  return `/projects/${encodePathPart(projectId)}/plans/${encodePathPart(planName)}`;
}

export default function NewPlanPage(props: NewPlanPageProps) {
  const routeProjectId = useMemo(() => parseProjectId(), []);
  const projectId = props.projectId ?? routeProjectId;
  const [values, setValues] = useState<PlanFormValues>(emptyPlanFormValues());
  const [rootPlanOptions, setRootPlanOptions] = useState<Reference[]>([]);
  const [canEditPlans, setCanEditPlans] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadForm() {
      setLoading(true);
      setErrors([]);

      try {
        const response = await fetch(`/api/projects/${encodePathPart(projectId)}/plans/new${window.location.search}`, {
          headers: { Accept: "application/json" },
        });
        const payload = await parseJsonResponse<PlanFormPayload>(response);
        setValues(valuesFromPayload(payload));
        setRootPlanOptions(payload.root_plan_options);
        setCanEditPlans(payload.can_edit_plans);
      } catch (apiError) {
        setErrors(apiError instanceof Error ? apiError.message.split("\n") : ["Unable to load plan form"]);
      } finally {
        setLoading(false);
      }
    }

    void loadForm();
  }, [projectId]);

  async function submitPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors([]);

    try {
      const response = await fetch(`/api/projects/${encodePathPart(projectId)}/plans`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ plan: values }),
      });
      const plan = await parseJsonResponse<PlanResponse>(response);
      window.location.assign(planPath(plan.project.name, plan.name));
    } catch (apiError) {
      setErrors(apiError instanceof Error ? apiError.message.split("\n") : ["Unable to create plan"]);
      setSubmitting(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <h1>New Plan</h1>
      <PlanForm
        values={values}
        canEditPlans={canEditPlans}
        rootPlanOptions={rootPlanOptions}
        errors={errors}
        submitting={submitting}
        submitLabel="Create"
        onChange={setValues}
        onSubmit={submitPlan}
      />
    </>
  );
}
