import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
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

function statusIconPath(build: Build) {
  return build.status_icon_path || `/assets/icons/small/${build.status}.png`;
}

function QuickLinks() {
  const { data: currentUser } = useCurrentUser();
  const accountLink = currentUser.initial_admin
    ? { label: "Create first administrator account", path: "/users/new" }
    : !currentUser.guest && currentUser.can_create_accounts
      ? { label: "Create accounts", path: "/users/new" }
      : { label: "Sign up", path: "/users/new" };

  return (
    <>
      <h2>Quick links</h2>
      <ul className="asterisk">
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
    </>
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
    <button
      type="button"
      className="stop-link"
      disabled={mutation.isPending || build.status === "stopping"}
      onClick={() => mutation.mutate()}
    >
      <img src="/assets/icons/small/stopped.png" alt="" width={16} height={16} /> Stop
    </button>
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
    <tr>
      <td>
        {child ? "+ " : null}
        <Link to={buildPath(build)}>{build.position}</Link>
      </td>
      <td>
        <Link to={projectPath(build)}>{build.plan.project_name}</Link> /{" "}
        <Link to={planPath(build)}>{build.plan.name}</Link>
      </td>
      <td>
        <Link to={buildPath(build)}>{formatTimestamp(build.created_at)}</Link>
      </td>
      <td>
        <img src={statusIconPath(build)} alt="" width={16} height={16} /> {build.status}
      </td>
      {showDuration ? <td>{formatDuration(build.duration)}</td> : null}
      {showStopAction ? (
        <td>{unfinishedStatuses.has(build.status) ? <StopButton build={build} /> : null}</td>
      ) : null}
    </tr>
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
    <table className="list">
      <thead>
        <tr>
          <th>Number</th>
          <th>Name</th>
          <th>Timestamp</th>
          <th>Status</th>
          {showDuration ? <th>Duration</th> : null}
          {showStopAction ? <th /> : null}
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
    </table>
  );
}

function BuildQueueWidget({ builds }: { builds: Build[] }) {
  return (
    <section>
      <h2>Build queue</h2>
      <DashboardBuildList builds={builds} />
    </section>
  );
}

function WorkerStatus({ worker }: { worker: Worker }) {
  if (worker.offline) {
    return (
      <p>
        <img src="/assets/icons/small/offline.png" alt="" width={16} height={16} />{" "}
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
        <h2>Worker status</h2>
        <p>
          No workers configured. <Link to="/admin/workers">Configure them now</Link>
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2>Worker status</h2>
      <ul>
        {workers.map((worker) => (
          <li key={worker.name}>
            <p>
              <strong>{worker.name}</strong>
            </p>
            <WorkerStatus worker={worker} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecentBuildsWidget({ builds }: { builds: Build[] }) {
  return (
    <section>
      <h2>Recently finished builds</h2>
      <DashboardBuildList builds={builds} showDuration showStopAction={false} />
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
    enabled: !currentUser.guest,
  });

  useChannel("QueueChannel", {}, onQueueMessage);

  return (
    <>
      <QuickLinks />
      {error ? <p>Dashboard data could not be loaded.</p> : null}
      {isLoading ? <p>Loading...</p> : null}
      <div id="queue">
        <BuildQueueWidget builds={data.queue} />
        <WorkerStatusWidget workers={data.workers} />
        <RecentBuildsWidget builds={data.recent_builds} />
      </div>
    </>
  );
}
