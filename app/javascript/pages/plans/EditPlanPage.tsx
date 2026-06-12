import React, { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PlanForm, { Reference, emptyPlanFormValues, PlanFormValues } from "../../components/plans/PlanForm";

type EditPlanPageProps = {
  projectId?: string;
  planId?: string;
};

type PlanPayload = {
  id: number;
  name: string;
  description: string | null;
  repository_url: string | null;
  steps: string | null;
  requirements: string | null;
  parent_id: number | null;
  previous_plan_id: number | null;
  project: Reference;
  can_edit_plans: boolean;
  root_plan_options: Reference[];
};

type ApiError = {
  errors?: string[];
};

function encodePathPart(value: string) {
  return encodeURIComponent(value);
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

function valuesFromPlan(plan: PlanPayload) {
  return emptyPlanFormValues({
    name: plan.name,
    description: plan.description ?? "",
    repository_url: plan.repository_url ?? "",
    steps: plan.steps ?? "",
    requirements: plan.requirements ?? "",
    parent_id: plan.parent_id,
    previous_plan_id: plan.previous_plan_id,
  });
}

function planPath(projectId: string, planName: string) {
  return `/projects/${encodePathPart(projectId)}/plans/${encodePathPart(planName)}`;
}

export default function EditPlanPage(props: EditPlanPageProps) {
  const { t } = useTranslation();
  const routeParams = useParams();
  const projectId = props.projectId ?? routeParams.projectId ?? "";
  const planId = props.planId ?? routeParams.planId ?? "";
  const [values, setValues] = useState<PlanFormValues>(emptyPlanFormValues());
  const [rootPlanOptions, setRootPlanOptions] = useState<Reference[]>([]);
  const [canEditPlans, setCanEditPlans] = useState(false);
  const [headingName, setHeadingName] = useState(planId);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadPlan() {
      setLoading(true);
      setErrors([]);

      try {
        const response = await fetch(`/api/projects/${encodePathPart(projectId)}/plans/${encodePathPart(planId)}`, {
          headers: { Accept: "application/json" },
        });
        const plan = await parseJsonResponse<PlanPayload>(response);
        setValues(valuesFromPlan(plan));
        setRootPlanOptions(plan.root_plan_options);
        setCanEditPlans(plan.can_edit_plans);
        setHeadingName(plan.name);
      } catch (apiError) {
        setErrors(apiError instanceof Error ? apiError.message.split("\n") : [t("spa.plans.load_error")]);
      } finally {
        setLoading(false);
      }
    }

    void loadPlan();
  }, [projectId, planId]);

  async function submitPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors([]);

    try {
      const response = await fetch(`/api/projects/${encodePathPart(projectId)}/plans/${encodePathPart(planId)}`, {
        method: "PATCH",
        headers: apiHeaders(),
        body: JSON.stringify({ plan: values }),
      });
      const plan = await parseJsonResponse<PlanPayload>(response);
      window.location.assign(planPath(plan.project.name, plan.name));
    } catch (apiError) {
      setErrors(apiError instanceof Error ? apiError.message.split("\n") : [t("spa.plans.update_error")]);
      setSubmitting(false);
    }
  }

  if (loading) return <p>{t("spa.loading")}</p>;

  return (
    <>
      <h1>{t("plans.edit.edit_plan_name", { name: headingName })}</h1>
      <PlanForm
        values={values}
        canEditPlans={canEditPlans}
        rootPlanOptions={rootPlanOptions}
        errors={errors}
        submitting={submitting}
        submitLabel={t("plans.edit.update")}
        onChange={setValues}
        onSubmit={submitPlan}
      />
    </>
  );
}
