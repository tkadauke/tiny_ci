import React, { MouseEvent, useCallback, useEffect, useMemo, useState } from "react";

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

const DELETE_CONFIRMATION =
  "Do you really want to delete this plan and all its children and builds? This operation can not be undone.";

const STATUS_LABELS: Record<string, string> = {
  canceled: "Canceled",
  error: "Error",
  failure: "Failure",
  pending: "Pending",
  running: "Running",
  stopped: "Stopped",
  stopping: "Stopping",
  success: "Success",
  waiting: "Waiting",
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

function parseRouteParams(): Required<PlanShowPageProps> {
  const match = window.location.pathname.match(/^\/projects\/([^/]+)\/plans\/([^/]+)/);

  return {
    projectId: match ? decodeURIComponent(match[1]) : "",
    planId: match ? decodeURIComponent(match[2]) : "",
  };
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

function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

function formatMaybeDate(value: string | null) {
  if (!value) return "unknown";

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
  return (
    <table className="list">
      <thead>
        <tr>
          <th />
          <th />
          <th>Name</th>
          <th>Description</th>
          <th>Last Build time</th>
          <th>Last Success</th>
          <th>Last Failure</th>
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
                  title={`${plan.weather} of the last 5 builds were successful`}
                />
              ) : null}
            </td>
            <td>
              <a href={`/projects/${encodePathPart(plan.project.name)}`}>{plan.project.name}</a> /{" "}
              <a href={planPath(plan.project.name, plan.name)}>{plan.name}</a>
            </td>
            <td>{truncate(plan.description)}</td>
            <td>{formatMaybeDate(plan.last_build_at)}</td>
            <td>{formatMaybeDate(plan.last_success_at)}</td>
            <td>{formatMaybeDate(plan.last_failure_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function PlanShowPage(props: PlanShowPageProps) {
  const routeParams = useMemo(() => parseRouteParams(), []);
  const projectId = props.projectId ?? routeParams.projectId;
  const planId = props.planId ?? routeParams.planId;
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
      setError(apiError instanceof Error ? apiError.message : "Unable to load plan");
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
      storeNotice("Successfully updated plan");
      window.location.assign(planPath(updatedPlan.project.name, updatedPlan.name));
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to update plan");
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
      setError(apiError instanceof Error ? apiError.message : "Unable to delete plan");
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
      setError(apiError instanceof Error ? apiError.message : "Unable to build plan");
      setSubmitting(false);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (error && !plan) return <p className="error">{error}</p>;
  if (!plan) return null;

  const isChild = plan.parent !== null;
  const parent = plan.parent;
  const hasChildren = plan.children.length > 0;

  return (
    <>
      <h1>
        Plan {plan.name}{" "}
        {plan.parent ? (
          <span>
            (child of <a href={planPath(projectId, plan.parent.name)}>{plan.parent.name}</a>)
          </span>
        ) : null}
      </h1>

      {error ? <p className="error">{error}</p> : null}
      {notice ? <div className="notice">{notice}</div> : null}

      <ul className="action-list">
        {plan.can_edit_plan ? (
          <li>
            <a href={`${planPath(projectId, plan.name)}/edit`}>Edit</a>
          </li>
        ) : null}
        <li>
          <a href={`${planPath(projectId, plan.name)}/builds`}>Builds</a>
        </li>
        {plan.can_create_plans ? (
          <li>
            <a href={`/projects/${encodePathPart(projectId)}/plans/new?clone=${encodeURIComponent(plan.name)}`}>Clone</a>
          </li>
        ) : null}
        {isChild && plan.can_edit_plan ? (
          <>
            <li>
              <a href={`${planPath(projectId, plan.name)}/child`}>Move to another Parent</a>
            </li>
            <li>
              <a href={planPath(projectId, plan.name)} onClick={convertToStandalone}>
                Convert to Standalone Plan
              </a>
            </li>
          </>
        ) : null}
        {!isChild && plan.can_create_plans ? (
          <li>
            <a href={`/projects/${encodePathPart(projectId)}/plans/new?parent=${encodeURIComponent(plan.name)}`}>New Child Plan</a>
          </li>
        ) : null}
        {!isChild && !hasChildren && plan.can_edit_plan ? (
          <li>
            <a href={`${planPath(projectId, plan.name)}/child`}>Convert to Child Plan</a>
          </li>
        ) : null}
        {plan.can_destroy_plan ? (
          <li>
            <button type="button" onClick={() => setShowDeleteConfirmation(true)} disabled={submitting}>
              Delete
            </button>
          </li>
        ) : null}
      </ul>

      {plan.previous_plan || plan.next_plan ? (
        <>
          <h2>Build chain</h2>
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
          <h2>Children</h2>
          <PlanList plans={plan.children} />
        </>
      ) : null}

      <h2>Plan details</h2>
      <dl>
        {plan.status ? (
          <>
            <dt>Status</dt>
            <dd>
              <Icon name={plan.status} size="large" />{" "}
              <span>
                {statusLabel(plan.status)}{" "}
                {plan.last_finished_build ? (
                  <a href={buildPath(projectId, plan.name, plan.last_finished_build.position)}>Latest Build</a>
                ) : null}
              </span>
            </dd>
          </>
        ) : null}

        {plan.weather !== null ? (
          <>
            <dt>Weather</dt>
            <dd>
              <Icon name={`weather-${plan.weather}`} size="large" />{" "}
              <span>{plan.weather} of the last 5 builds were successful</span>
            </dd>
          </>
        ) : null}

        <dt>Description</dt>
        <dd style={{ whiteSpace: "pre-wrap" }}>{plan.description}</dd>

        <dt>Steps</dt>
        <dd>
          <pre>{plan.steps}</pre>
        </dd>

        <dt>Requirements</dt>
        <dd>{plan.requirements || "\u00a0"}</dd>

        {!isChild ? (
          <>
            <dt>Commit Hook</dt>
            <dd>
              <table>
                <tbody>
                  <tr>
                    <th>URL</th>
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
          Build now
        </button>
      ) : parent ? (
        <p>
          <a href={planPath(projectId, parent.name)}>Back to parent plan {parent.name}</a>
        </p>
      ) : null}

      <p>
        Back to project <a href={`/projects/${encodePathPart(projectId)}/plans`}>{plan.project.name}</a>
      </p>

      {showDeleteConfirmation ? (
        <div role="dialog" aria-modal="true" aria-labelledby="delete-plan-title">
          <h2 id="delete-plan-title">Delete plan</h2>
          <p>{DELETE_CONFIRMATION}</p>
          <button type="button" onClick={deletePlan} disabled={submitting}>
            Confirm
          </button>
          <button type="button" onClick={() => setShowDeleteConfirmation(false)} disabled={submitting}>
            Cancel
          </button>
        </div>
      ) : null}
    </>
  );
}
