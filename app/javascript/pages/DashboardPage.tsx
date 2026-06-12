import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useChannel } from "@/hooks/useChannel";
import { api } from "@/lib/api";
import type { Build } from "@/hooks/useBuilds";

type Worker = {
  name: string;
  offline: boolean;
  running_builds?: Build[];
};

type Dashboard = {
  queue: Build[];
  workers: Worker[];
  recent_builds: Build[];
};

const dashboardQueryKey = ["dashboard"];
const unfinishedStatuses = new Set(["pending", "running", "waiting", "stopping"]);

async function fetchDashboard() {
  return api.get<Dashboard>("/api/dashboard");
}

function buildPath(build: Build) {
  return `/projects/${build.plan.project_id}/plans/${build.plan.plan_id}/builds/${build.position}`;
}

function planPath(build: Build) {
  return `/projects/${build.plan.project_id}/plans/${build.plan.plan_id}`;
}

function projectPath(build: Build) {
  return `/projects/${build.plan.project_id}`;
}

function stopPath(build: Build) {
  return `/api/projects/${build.plan.project_id}/plans/${build.plan.plan_id}/builds/${build.position}/stop`;
}

function formatTimestamp(value: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function formatDuration(value: number | null) {
  if (value == null) return "";

  let duration = Math.floor(Number(value));
  if (!duration) return "";

  const seconds = duration % 60;
  duration = Math.floor(duration / 60);
  const minutes = duration % 60;
  duration = Math.floor(duration / 60);
  const hours = duration % 24;
  const days = Math.floor(duration / 24);

  return [
    [days, "days"],
    [hours, "hours"],
    [minutes, "minutes"],
    [seconds, "seconds"],
  ]
    .filter(([amount]) => amount !== 0)
    .map(([amount, label]) => `${amount} ${label}`)
    .join(", ");
}

function statusLabel(status: string) {
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

function QuickLinks() {
  const { data: currentUser } = useCurrentUser();
  const accountLink = currentUser.initial_admin
    ? { label: "Create first administrator account", path: "/users/new" }
    : !currentUser.guest && currentUser.can_create_accounts
      ? { label: "Create accounts", path: "/users/new" }
      : { label: "Sign up", path: "/users/new" };

  return (
    <Card>
      <CardHeader>Quick links</CardHeader>
      <CardBody>
      <ul className="space-y-2 text-sm">
        <li>
          <Link to={accountLink.path}>{accountLink.label}</Link>
        </li>
        <li>
          <Link to="/projects/new">Create a project</Link>
        </li>
        <li>
          <Link to="/admin/workers">Manage build workers</Link>
        </li>
      </ul>
      </CardBody>
    </Card>
  );
}

function StopButton({ build }: { build: Build }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => api.post<void>(stopPath(build), {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    },
  });

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={mutation.isPending || build.status === "stopping"}
      onClick={() => mutation.mutate()}
    >
      Stop
    </Button>
  );
}

function BuildRow({
  build,
  child = false,
  showDuration,
  showStopAction,
}: {
  build: Build;
  child?: boolean;
  showDuration: boolean;
  showStopAction: boolean;
}) {
  return (
    <Tr>
      <Td>
        {child ? "+ " : null}
        <Link to={buildPath(build)}>{build.position}</Link>
      </Td>
      <Td>
        <Link to={projectPath(build)}>{build.plan.project_name}</Link> /{" "}
        <Link to={planPath(build)}>{build.plan.name}</Link>
      </Td>
      <Td>
        <Link to={buildPath(build)}>{formatTimestamp(build.created_at)}</Link>
      </Td>
      <Td>
        <StatusBadge status={build.status} label={statusLabel(build.status)} />
      </Td>
      {showDuration ? <Td>{formatDuration(build.duration)}</Td> : null}
      {showStopAction ? (
        <Td>{unfinishedStatuses.has(build.status) ? <StopButton build={build} /> : null}</Td>
      ) : null}
    </Tr>
  );
}

function DashboardBuildList({
  builds = [],
  showDuration = false,
  showStopAction = true,
}: {
  builds?: Build[];
  showDuration?: boolean;
  showStopAction?: boolean;
}) {
  if (builds.length === 0) return <p>No builds</p>;

  return (
    <Table>
      <thead>
        <tr>
          <Th>Number</Th>
          <Th>Name</Th>
          <Th>Timestamp</Th>
          <Th>Status</Th>
          {showDuration ? <Th>Duration</Th> : null}
          {showStopAction ? <Th /> : null}
        </tr>
      </thead>
      <tbody>
        {builds.flatMap((build) => [
          <BuildRow
            key={`build-${build.id}`}
            build={build}
            showDuration={showDuration}
            showStopAction={showStopAction}
          />,
          ...(build.children || []).map((child) => (
            <BuildRow
              key={`build-${build.id}-child-${child.id}`}
              build={child}
              child
              showDuration={showDuration}
              showStopAction={showStopAction}
            />
          )),
        ])}
      </tbody>
    </Table>
  );
}

function BuildQueueWidget({ builds }: { builds: Build[] }) {
  return (
    <section>
    <Card>
      <CardHeader>Build queue</CardHeader>
      <CardBody>
      <DashboardBuildList builds={builds} />
      </CardBody>
    </Card>
    </section>
  );
}

function WorkerStatus({ worker }: { worker: Worker }) {
  if (worker.offline) {
    return (
      <p className="flex items-center gap-2 text-sm">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden="true" />
        Slave is offline.
        <Link to={`/admin/workers/${worker.name}/edit`}>Configure</Link>
      </p>
    );
  }

  return <DashboardBuildList builds={worker.running_builds || []} />;
}

function WorkerStatusWidget({ workers }: { workers: Worker[] }) {
  if (workers.length === 0) {
    return (
      <section>
      <Card>
        <CardHeader>Worker status</CardHeader>
        <CardBody>
        <p>
          No workers configured. <Link to="/admin/workers">Configure them now</Link>
        </p>
        </CardBody>
      </Card>
      </section>
    );
  }

  return (
    <section>
    <Card>
      <CardHeader>Worker status</CardHeader>
      <CardBody>
      <ul className="space-y-4">
        {workers.map((worker) => (
          <li key={worker.name}>
            <p className="mb-2 flex items-center gap-2 text-sm">
              <span className={`h-2.5 w-2.5 rounded-full ${worker.offline ? "bg-red-500" : "bg-green-500"}`} aria-hidden="true" />
              <strong>{worker.name}</strong>
            </p>
            <WorkerStatus worker={worker} />
          </li>
        ))}
      </ul>
      </CardBody>
    </Card>
    </section>
  );
}

function RecentBuildsWidget({ builds }: { builds: Build[] }) {
  return (
    <section>
    <Card>
      <CardHeader>Recently finished builds</CardHeader>
      <CardBody>
      <DashboardBuildList builds={builds} showDuration showStopAction={false} />
      </CardBody>
    </Card>
    </section>
  );
}

export function DashboardPage() {
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const onQueueMessage = () => {
    queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
  };
  const { data = { queue: [], workers: [], recent_builds: [] }, error, isLoading } = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: fetchDashboard,
  });

  useChannel("QueueChannel", {}, onQueueMessage);

  return (
    <>
      {error ? <p>Dashboard data could not be loaded.</p> : null}
      {isLoading ? <p>Loading...</p> : null}
      <div className="mb-4">
        <QuickLinks />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BuildQueueWidget builds={data.queue} />
        <WorkerStatusWidget workers={data.workers} />
        <RecentBuildsWidget builds={data.recent_builds} />
      </div>
    </>
  );
}
