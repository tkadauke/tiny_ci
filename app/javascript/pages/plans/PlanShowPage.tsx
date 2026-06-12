import React, { MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

type Reference = {
  id: number;
  name: string;
};

type BuildReference = {
  position: number;
  status: string;
};

type PlanSummary = {
  id: number;
  name: string;
  description: string | null;
  status: string | null;
  weather: number | null;
  project: Reference;
  last_build_at: string | null;
  last_success_at: string | null;
  last_failure_at: string | null;
  previous_plan: Reference | null;
  next_plan: Reference | null;
  parent: Reference | null;
  children_count: number;
};

type PlanDetail = PlanSummary & {
  repository_url: string | null;
  steps: string | null;
  requirements: string | null;
  commit_hook_url: string;
  children: PlanSummary[];
  last_finished_build: BuildReference | null;
  can_edit_plan: boolean;
  can_create_plans: boolean;
  can_destroy_plan: boolean;
};

type PlanShowPageProps = {
  projectId?: string;
  planId?: string;
};

type ApiError = {
  errors?: string[];
};

function encodePathPart(value: string) {
  return encodeURIComponent(value);
}

function planPath(projectId: string, planName: string) {
  return `/projects/${encodePathPart(projectId)}/plans/${encodePathPart(planName)}`;
}

function buildPath(projectId: string, planName: string, position: number) {
  return `${planPath(projectId, planName)}/builds/${position}`;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  let message = `${response.status} ${response.statusText}`;

  try {
    const body = (await response.json()) as ApiError;
    if (body.errors && body.errors.length > 0) {
      message = body.errors.join(", ");
    }
  } catch {
    // Keep the HTTP status text when the API does not return JSON.
  }

  throw new Error(message);
}

function apiHeaders() {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

function storeNotice(message: string) {
  window.sessionStorage.setItem("tiny_ci_flash_notice", message);
}

function formatMaybeDate(value: string | null, unknown: string) {
  if (!value) return unknown;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function truncate(value: string | null, length = 40) {
  if (!value) return "";
  return value.length > length ? `${value.slice(0, length - 3)}...` : value;
}

function Icon({ name, size, title }: { name: string; size: "small" | "large"; title?: string }) {
  return <img src={`/assets/icons/${size}/${name}.png`} alt={title ?? name} title={title} />;
}

function PlanList({ plans }: { plans: PlanSummary[] }) {
  const { t } = useTranslation();

  return (
    <table className="list">
      <thead>
        <tr>
          <th />
          <th />
          <th>{t("plans.list.name")}</th>
          <th>{t("plans.list.description")}</th>
          <th>{t("plans.list.last_build_time")}</th>
          <th>{t("plans.list.last_success")}</th>
          <th>{t("plans.list.last_failure")}</th>
        </tr>
      </thead>
      <tbody>
        {plans.map((plan) => (
          <tr key={plan.id}>
            <td>{plan.status ? <Icon name={plan.status} size="small" /> : null}</td>
            <td>
              {plan.weather !== null ? (
                <Icon
                  name={`weather-${plan.weather}`}
                  size="small"
                  title={t("plans.list.count_of_the_last_5_builds_were_successful", { count: plan.weather })}
                />
              ) : null}
            </td>
            <td>
              <a href={`/projects/${encodePathPart(plan.project.name)}`}>{plan.project.name}</a> /{" "}
              <a href={planPath(plan.project.name, plan.name)}>{plan.name}</a>
            </td>
            <td>{truncate(plan.description)}</td>
            <td>{formatMaybeDate(plan.last_build_at, t("plans.list.unknown"))}</td>
            <td>{formatMaybeDate(plan.last_success_at, t("plans.list.unknown"))}</td>
            <td>{formatMaybeDate(plan.last_failure_at, t("plans.list.unknown"))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function PlanShowPage(props: PlanShowPageProps) {
  const { t } = useTranslation();
  const routeParams = useParams();
  const projectId = props.projectId ?? routeParams.projectId ?? "";
  const planId = props.planId ?? routeParams.planId ?? "";
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const storedNotice = window.sessionStorage.getItem("tiny_ci_flash_notice");
    if (storedNotice) {
      setNotice(storedNotice);
      window.sessionStorage.removeItem("tiny_ci_flash_notice");
    }
  }, []);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${encodePathPart(projectId)}/plans/${encodePathPart(planId)}`, {
        headers: { Accept: "application/json" },
      });
      setPlan(await parseJsonResponse<PlanDetail>(response));
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : t("spa.plans.load_error"));
    } finally {
      setLoading(false);
    }
  }, [projectId, planId]);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  async function convertToStandalone(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (!plan) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${encodePathPart(projectId)}/plans/${encodePathPart(plan.name)}`, {
        method: "PATCH",
        headers: apiHeaders(),
        body: JSON.stringify({ parent_id: null }),
      });
      const updatedPlan = await parseJsonResponse<PlanDetail>(response);
      storeNotice(t("flash.notice.updated_plan"));
      window.location.assign(planPath(updatedPlan.project.name, updatedPlan.name));
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : t("spa.plans.update_error"));
    } finally {
      setSubmitting(false);
    }
  }

  async function deletePlan() {
    if (!plan) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${encodePathPart(projectId)}/plans/${encodePathPart(plan.name)}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      await parseJsonResponse<{ ok: boolean }>(response);
      window.location.assign(`/projects/${encodePathPart(projectId)}/plans`);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : t("spa.plans.delete_error"));
      setSubmitting(false);
      setShowDeleteConfirmation(false);
    }
  }

  async function buildNow() {
    if (!plan) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${encodePathPart(projectId)}/plans/${encodePathPart(plan.name)}/builds`, {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      const body = await parseJsonResponse<{ build: { position: number } }>(response);
      window.location.assign(buildPath(projectId, plan.name, body.build.position));
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : t("spa.plans.build_error"));
      setSubmitting(false);
    }
  }

  if (loading) return <p>{t("spa.loading")}</p>;
  if (error && !plan) return <p className="error">{error}</p>;
  if (!plan) return null;

  const isChild = plan.parent !== null;
  const parent = plan.parent;
  const hasChildren = plan.children.length > 0;

  return (
    <>
      <h1>
        {t("plans.show.plan_name", { name: plan.name })}{" "}
        {plan.parent ? (
          <span>
            {t("spa.plans.child_of_prefix")} <a href={planPath(projectId, plan.parent.name)}>{plan.parent.name}</a>)
          </span>
        ) : null}
      </h1>

      {error ? <p className="error">{error}</p> : null}
      {notice ? <div className="notice">{notice}</div> : null}

      <ul className="action-list">
        {plan.can_edit_plan ? (
          <li>
            <a href={`${planPath(projectId, plan.name)}/edit`}>{t("plans.show.edit")}</a>
          </li>
        ) : null}
        <li>
          <a href={`${planPath(projectId, plan.name)}/builds`}>{t("plans.show.builds")}</a>
        </li>
        {plan.can_create_plans ? (
          <li>
            <a href={`/projects/${encodePathPart(projectId)}/plans/new?clone=${encodeURIComponent(plan.name)}`}>{t("plans.show.clone")}</a>
          </li>
        ) : null}
        {isChild && plan.can_edit_plan ? (
          <>
            <li>
              <a href={`${planPath(projectId, plan.name)}/child`}>{t("plans.show.move_to_another_parent")}</a>
            </li>
            <li>
              <a href={planPath(projectId, plan.name)} onClick={convertToStandalone}>
                {t("plans.show.convert_to_standalone_plan")}
              </a>
            </li>
          </>
        ) : null}
        {!isChild && plan.can_create_plans ? (
          <li>
            <a href={`/projects/${encodePathPart(projectId)}/plans/new?parent=${encodeURIComponent(plan.name)}`}>{t("plans.show.new_child_plan")}</a>
          </li>
        ) : null}
        {!isChild && !hasChildren && plan.can_edit_plan ? (
          <li>
            <a href={`${planPath(projectId, plan.name)}/child`}>{t("plans.show.convert_to_child_plan")}</a>
          </li>
        ) : null}
        {plan.can_destroy_plan ? (
          <li>
            <button type="button" onClick={() => setShowDeleteConfirmation(true)} disabled={submitting}>
              {t("plans.show.delete")}
            </button>
          </li>
        ) : null}
      </ul>

      {plan.previous_plan || plan.next_plan ? (
        <>
          <h2>{t("plans.show.build_chain")}</h2>
          <table>
            <tbody>
              <tr>
                <td>{plan.previous_plan ? <a href={planPath(projectId, plan.previous_plan.name)}>{plan.previous_plan.name}</a> : null}</td>
                <td>{plan.name}</td>
                <td>{plan.next_plan ? <a href={planPath(projectId, plan.next_plan.name)}>{plan.next_plan.name}</a> : null}</td>
              </tr>
            </tbody>
          </table>
        </>
      ) : null}

      {hasChildren ? (
        <>
          <h2>{t("plans.show.children")}</h2>
          <PlanList plans={plan.children} />
        </>
      ) : null}

      <h2>{t("plans.show.plan_details")}</h2>
      <dl>
        {plan.status ? (
          <>
            <dt>{t("plans.show.status")}</dt>
            <dd>
              <Icon name={plan.status} size="large" />{" "}
              <span>
                {t(`build.status.${plan.status}`, { defaultValue: plan.status })}{" "}
                {plan.last_finished_build ? (
                  <a href={buildPath(projectId, plan.name, plan.last_finished_build.position)}>{t("plans.show.latest_build")}</a>
                ) : null}
              </span>
            </dd>
          </>
        ) : null}

        {plan.weather !== null ? (
          <>
            <dt>{t("plans.show.weather")}</dt>
            <dd>
              <Icon name={`weather-${plan.weather}`} size="large" />{" "}
              <span>{t("plans.show.count_of_the_last_5_builds_were_successful", { count: plan.weather })}</span>
            </dd>
          </>
        ) : null}

        <dt>{t("plans.show.description")}</dt>
        <dd style={{ whiteSpace: "pre-wrap" }}>{plan.description}</dd>

        <dt>{t("plans.show.steps")}</dt>
        <dd>
          <pre>{plan.steps}</pre>
        </dd>

        <dt>{t("plans.show.requirements")}</dt>
        <dd>{plan.requirements || "\u00a0"}</dd>

        {!isChild ? (
          <>
            <dt>{t("plans.show.commit_hook")}</dt>
            <dd>
              <table>
                <tbody>
                  <tr>
                    <th>{t("plans.show.url")}</th>
                    <td>
                      <input type="text" readOnly size={80} value={plan.commit_hook_url} />
                    </td>
                  </tr>
                  <tr>
                    <th>wget</th>
                    <td>
                      <input type="text" readOnly size={80} value={`wget --post-data="" --output-file=/dev/null ${plan.commit_hook_url}`} />
                    </td>
                  </tr>
                  <tr>
                    <th>curl</th>
                    <td>
                      <input type="text" readOnly size={80} value={`curl --data "" --output /dev/null --silent ${plan.commit_hook_url}`} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </dd>
          </>
        ) : null}
      </dl>

      {!isChild ? (
        <button type="button" onClick={buildNow} disabled={submitting}>
          {t("plans.show.build_now")}
        </button>
      ) : parent ? (
        <p>
          <a href={planPath(projectId, parent.name)}>{t("plans.show.back_to_parent_plan", { parent: parent.name })}</a>
        </p>
      ) : null}

      <p>
        {t("spa.plans.back_to_project")} <a href={`/projects/${encodePathPart(projectId)}/plans`}>{plan.project.name}</a>
      </p>

      {showDeleteConfirmation ? (
        <div role="dialog" aria-modal="true" aria-labelledby="delete-plan-title">
          <h2 id="delete-plan-title">{t("spa.plans.delete_heading")}</h2>
          <p>{t("plans.show.confirm_delete")}</p>
          <button type="button" onClick={deletePlan} disabled={submitting}>
            {t("spa.actions.confirm")}
          </button>
          <button type="button" onClick={() => setShowDeleteConfirmation(false)} disabled={submitting}>
            {t("spa.actions.cancel")}
          </button>
        </div>
      ) : null}
    </>
  );
}
