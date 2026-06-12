import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { TabBar } from "@/components/ui/TabBar";
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
  return (
    <TabBar
      activeKey={mode}
      items={[
        { key: "list", label: "Details", href: `${basePath}?report=list` },
        { key: "overview", label: "Overview", href: `${basePath}?report=overview` },
      ]}
    />
  );
}

export function PlanListing({
  heading,
  endpoint,
  basePath,
  canCreatePlans = false,
  newPlanPath = null,
}: PlanListingProps) {
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
      <PageHeader
        title={heading}
        actions={
          canCreatePlans && newPlanPath ? (
            <Link to={newPlanPath}>
              <Button type="button">New Plan</Button>
            </Link>
          ) : null
        }
      />
      <ModeToggle mode={mode} basePath={basePath} />
      <div>
        {isLoading ? <p>Loading...</p> : null}
        {error ? <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Could not load plans.</p> : null}
        {!isLoading && !error ? <PlanList plans={plans} mode={mode} /> : null}
      </div>
    </>
  );
}
