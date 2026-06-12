import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Reference } from "../../components/plans/PlanForm";

type SelectParentPageProps = {
  projectId?: string;
  planId?: string;
};

type PlanPayload = {
  id: number;
  name: string;
  parent_id: number | null;
  project: Reference;
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

function numberFromSelect(value: string) {
  return value === "" ? null : Number(value);
}

function planPath(projectId: string, planName: string) {
  return `/projects/${encodePathPart(projectId)}/plans/${encodePathPart(planName)}`;
}

function storeNotice(message: string) {
  window.sessionStorage.setItem("tiny_ci_flash_notice", message);
}

export default function SelectParentPage(props: SelectParentPageProps) {
  const { t } = useTranslation();
  const routeParams = useParams();
  const projectId = props.projectId ?? routeParams.projectId ?? "";
  const planId = props.planId ?? routeParams.planId ?? "";
  const [plan, setPlan] = useState<PlanPayload | null>(null);
  const [parentId, setParentId] = useState<number | null>(null);
  const [rootPlanOptions, setRootPlanOptions] = useState<Reference[]>([]);
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
        const payload = await parseJsonResponse<PlanPayload>(response);
        setPlan(payload);
        setParentId(payload.parent_id);
        setRootPlanOptions(payload.root_plan_options);
      } catch (apiError) {
        setErrors(apiError instanceof Error ? apiError.message.split("\n") : [t("spa.plans.load_error")]);
      } finally {
        setLoading(false);
      }
    }

    void loadPlan();
  }, [projectId, planId]);

  function updateParent(event: ChangeEvent<HTMLSelectElement>) {
    setParentId(numberFromSelect(event.target.value));
  }

  async function submitParent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors([]);

    try {
      const response = await fetch(`/api/projects/${encodePathPart(projectId)}/plans/${encodePathPart(planId)}`, {
        method: "PATCH",
        headers: apiHeaders(),
        body: JSON.stringify({ parent_id: parentId }),
      });
      const updatedPlan = await parseJsonResponse<PlanPayload>(response);
      storeNotice(t("flash.notice.updated_plan"));
      window.location.assign(planPath(updatedPlan.project.name, updatedPlan.name));
    } catch (apiError) {
      setErrors(apiError instanceof Error ? apiError.message.split("\n") : [t("spa.plans.update_error")]);
      setSubmitting(false);
    }
  }

  if (loading) return <p>{t("spa.loading")}</p>;

  return (
    <>
      <h1>{t("plans.child.select_parent_plan_for_plan", { plan: plan?.name ?? planId })}</h1>

      {errors.length > 0 ? (
        <div className="errorExplanation">
          <h2>{t("spa.plans.save_error", { count: errors.length })}</h2>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <form onSubmit={submitParent}>
        <p className="form_item">
          <span className="label">
            <label htmlFor="plan_parent_id">{t("plans.child.select_parent_plan")}</label>
          </span>
          <select id="plan_parent_id" name="plan[parent_id]" value={parentId ?? ""} onChange={updateParent}>
            <option value="" />
            {rootPlanOptions.map((rootPlan) => (
              <option key={rootPlan.id} value={rootPlan.id}>
                {rootPlan.name}
              </option>
            ))}
          </select>
        </p>

        <button type="submit" disabled={submitting}>
          {t("plans.child.update")}
        </button>
      </form>
    </>
  );
}
