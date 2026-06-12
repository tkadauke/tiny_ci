import React, { MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/Badge";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { WeatherIcon } from "@/components/plans/WeatherIcon";
import { inputClassName } from "@/components/ui/FormField";

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

function PlanList({ plans }: { plans: PlanSummary[] }) {
  return (
    <Table>
      <thead>
        <tr>
          <Th />
          <Th />
          <Th>Name</Th>
          <Th>Description</Th>
          <Th>Last Build time</Th>
          <Th>Last Success</Th>
          <Th>Last Failure</Th>
        </tr>
      </thead>
      <tbody>
        {plans.map((plan) => (
          <Tr key={plan.id}>
            <Td>{plan.status ? <StatusBadge status={plan.status} /> : null}</Td>
            <Td>{plan.weather !== null ? <WeatherIcon weather={plan.weather} /> : null}</Td>
            <Td>
              <a href={`/projects/${encodePathPart(plan.project.name)}`}>{plan.project.name}</a> /{" "}
              <a href={planPath(plan.project.name, plan.name)}>{plan.name}</a>
            </Td>
            <Td>{truncate(plan.description)}</Td>
            <Td>{formatMaybeDate(plan.last_build_at)}</Td>
            <Td>{formatMaybeDate(plan.last_success_at)}</Td>
            <Td>{formatMaybeDate(plan.last_failure_at)}</Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}

export default function PlanShowPage(props: PlanShowPageProps) {
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
  if (error && !plan) return <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  if (!plan) return null;

  const isChild = plan.parent !== null;
  const parent = plan.parent;
  const hasChildren = plan.children.length > 0;

  const linkClass = "text-sm text-blue-600 hover:text-blue-500";

  return (
    <>
      <PageHeader
        title={
          <>
            Plan {plan.name}
            {plan.parent ? (
              <span className="ml-2 text-sm font-normal text-gray-500">
                child of <a className={linkClass} href={planPath(projectId, plan.parent.name)}>{plan.parent.name}</a>
              </span>
            ) : null}
          </>
        }
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {plan.can_edit_plan ? <a className={linkClass} href={`${planPath(projectId, plan.name)}/edit`}>Edit</a> : null}
            <a className={linkClass} href={`${planPath(projectId, plan.name)}/builds`}>Builds</a>
            {plan.can_create_plans ? <a className={linkClass} href={`/projects/${encodePathPart(projectId)}/plans/new?clone=${encodeURIComponent(plan.name)}`}>Clone</a> : null}
            {isChild && plan.can_edit_plan ? <a className={linkClass} href={`${planPath(projectId, plan.name)}/child`}>Move</a> : null}
            {isChild && plan.can_edit_plan ? <a className={linkClass} href={planPath(projectId, plan.name)} onClick={convertToStandalone}>Standalone</a> : null}
            {!isChild && plan.can_create_plans ? <a className={linkClass} href={`/projects/${encodePathPart(projectId)}/plans/new?parent=${encodeURIComponent(plan.name)}`}>New Child</a> : null}
            {!isChild && !hasChildren && plan.can_edit_plan ? <a className={linkClass} href={`${planPath(projectId, plan.name)}/child`}>Make Child</a> : null}
            {plan.can_destroy_plan ? (
              <Button type="button" variant="danger" size="sm" onClick={() => setShowDeleteConfirmation(true)} disabled={submitting}>
                Delete
              </Button>
            ) : null}
          </div>
        }
      />

      {error ? <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {notice ? <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</div> : null}

      {plan.previous_plan || plan.next_plan ? (
        <>
          <h2 className="mb-3 text-base font-semibold text-gray-900">Build chain</h2>
          <Card className="mb-6">
            <CardBody>
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                <div>{plan.previous_plan ? <a className={linkClass} href={planPath(projectId, plan.previous_plan.name)}>{plan.previous_plan.name}</a> : "No previous plan"}</div>
                <div className="font-medium text-gray-900">{plan.name}</div>
                <div>{plan.next_plan ? <a className={linkClass} href={planPath(projectId, plan.next_plan.name)}>{plan.next_plan.name}</a> : "No next plan"}</div>
              </div>
            </CardBody>
          </Card>
        </>
      ) : null}

      {hasChildren ? (
        <Card className="mb-6">
          <CardHeader>Children</CardHeader>
          <CardBody>
            <PlanList plans={plan.children} />
          </CardBody>
        </Card>
      ) : null}

      <Card className="mb-6">
        <CardHeader>Plan details</CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {plan.status ? (
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <StatusBadge status={plan.status} />
                  {plan.last_finished_build ? <a className={linkClass} href={buildPath(projectId, plan.name, plan.last_finished_build.position)}>Latest Build</a> : null}
                </dd>
              </div>
            ) : null}
            {plan.weather !== null ? (
              <div>
                <dt className="text-sm font-medium text-gray-500">Weather</dt>
                <dd className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                  <WeatherIcon weather={plan.weather} size="large" />
                  <span>{plan.weather} of the last 5 builds were successful</span>
                </dd>
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-900">{plan.description}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Steps</dt>
              <dd className="mt-1">
                <pre className="overflow-x-auto rounded-lg bg-gray-950 p-4 font-mono text-xs text-gray-100">{plan.steps}</pre>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Requirements</dt>
              <dd className="mt-1 text-sm text-gray-900">{plan.requirements || "\u00a0"}</dd>
            </div>
            {!isChild ? (
              <div className="space-y-3 sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Commit Hook</dt>
                <input className={inputClassName} type="text" readOnly value={plan.commit_hook_url} />
                <input className={inputClassName} type="text" readOnly value={`wget --post-data="" --output-file=/dev/null ${plan.commit_hook_url}`} />
                <input className={inputClassName} type="text" readOnly value={`curl --data "" --output /dev/null --silent ${plan.commit_hook_url}`} />
              </div>
            ) : null}
          </dl>
        </CardBody>
      </Card>

      {!isChild ? (
        <Button type="button" onClick={buildNow} disabled={submitting}>
          Build now
        </Button>
      ) : parent ? (
        <p className="text-sm">
          <a className={linkClass} href={planPath(projectId, parent.name)}>Back to parent plan {parent.name}</a>
        </p>
      ) : null}

      <p className="mt-4 text-sm text-gray-600">
        Back to project <a className={linkClass} href={`/projects/${encodePathPart(projectId)}/plans`}>{plan.project.name}</a>
      </p>

      {showDeleteConfirmation ? (
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardBody>
            <div role="dialog" aria-modal="true" aria-labelledby="delete-plan-title">
              <h2 id="delete-plan-title" className="mb-2 text-base font-semibold text-red-900">Delete plan</h2>
              <p className="mb-4 text-sm text-red-800">{DELETE_CONFIRMATION}</p>
              <div className="flex gap-3">
                <Button type="button" variant="danger" onClick={deletePlan} disabled={submitting}>
                  Confirm
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowDeleteConfirmation(false)} disabled={submitting}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : null}
    </>
  );
}
