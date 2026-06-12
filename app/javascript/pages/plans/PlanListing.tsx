import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PlanList, type PlanListPlan } from "@/components/plans/PlanList";

type ReportMode = "list" | "overview";

type PlanListingProps = {
  heading: string;
  endpoint: string;
  basePath: string;
  canCreatePlans?: boolean;
  newPlanPath?: string | null;
};

function isReportMode(value: string | null): value is ReportMode {
  return value === "list" || value === "overview";
}

async function fetchPlans(endpoint: string) {
  const response = await fetch(endpoint, {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(`Plans failed with ${response.status}`);
  }

  return response.json() as Promise<PlanListPlan[]>;
}

function ModeToggle({ mode, basePath }: { mode: ReportMode; basePath: string }) {
  const { t } = useTranslation();

  return (
    <ul className="action-list">
      <li>
        <Link to={`${basePath}?report=list`} aria-current={mode === "list" ? "page" : undefined}>
          {t("plans.full_index.details")}
        </Link>
      </li>
      <li>
        <Link
          to={`${basePath}?report=overview`}
          aria-current={mode === "overview" ? "page" : undefined}
        >
          {t("plans.full_index.overview")}
        </Link>
      </li>
    </ul>
  );
}

export function PlanListing({
  heading,
  endpoint,
  basePath,
  canCreatePlans = false,
  newPlanPath = null,
}: PlanListingProps) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const report = searchParams.get("report");
  const mode = isReportMode(report) ? report : "list";
  const { data: plans = [], error, isLoading } = useQuery({
    queryKey: ["plans", endpoint],
    queryFn: () => fetchPlans(endpoint),
    refetchInterval: 15000,
  });

  return (
    <>
      <h1>{heading}</h1>
      <ModeToggle mode={mode} basePath={basePath} />
      <div id="plans">
        {isLoading ? <p>{t("spa.loading")}</p> : null}
        {error ? <p className="error">{t("spa.plans.load_error")}</p> : null}
        {!isLoading && !error ? <PlanList plans={plans} mode={mode} /> : null}
      </div>
      {canCreatePlans && newPlanPath ? (
        <p>
          <Link to={newPlanPath}>{t("plans.index.new_plan")}</Link>
        </p>
      ) : null}
    </>
  );
}
