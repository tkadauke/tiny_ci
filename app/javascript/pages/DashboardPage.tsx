import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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

function formatDuration(value: number | null, t: (key: string) => string) {
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
    [days, t("duration.days")],
    [hours, t("duration.hours")],
    [minutes, t("duration.minutes")],
    [seconds, t("duration.seconds")],
  ]
    .filter(([amount]) => amount !== 0)
    .map(([amount, label]) => `${amount} ${label}`)
    .join(", ");
}

function QuickLinks() {
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const accountLink = currentUser.initial_admin
    ? { label: t("start.index.create_admin_account"), path: "/users/new" }
    : !currentUser.guest && currentUser.can_create_accounts
      ? { label: t("start.index.create_accounts"), path: "/users/new" }
      : { label: t("start.index.sign_up"), path: "/users/new" };

  return (
    <>
      <h2>{t("start.index.quick_links")}</h2>
      <ul className="asterisk">
        <li>
          <Link to={accountLink.path}>{accountLink.label}</Link>
        </li>
        <li>
          <Link to="/projects/new">{t("start.index.create_a_project")}</Link>
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
  const { t } = useTranslation();
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
      <img src="/assets/icons/small/stopped.png" alt="" width={16} height={16} /> {t("spa.actions.stop")}
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
  const { t } = useTranslation();

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
        <StatusBadge status={build.status} label={t(`build.status.${build.status}`, { defaultValue: build.status })} />
      </Td>
      {showDuration ? <Td>{formatDuration(build.duration, t)}</Td> : null}
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
  const { t } = useTranslation();

  if (builds.length === 0) return <p>{t("builds.list.no_builds")}</p>;

  return (
    <Table>
      <thead>
        <tr>
          <Th>{t("builds.list.number")}</Th>
          <Th>{t("builds.list.name")}</Th>
          <Th>{t("builds.list.timestamp")}</Th>
          <Th>{t("builds.list.status")}</Th>
          {showDuration ? <Th>{t("builds.completed.duration")}</Th> : null}
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
  const { t } = useTranslation();

  return (
    <section>
      <h2>{t("start.queue.build_queue")}</h2>
      <DashboardBuildList builds={builds} />
    </section>
  );
}

function WorkerStatus({ worker }: { worker: Worker }) {
  if (worker.offline) {
    return (
      <p>
        <img src="/assets/icons/small/offline.png" alt="" width={16} height={16} />{" "}
        Slave is offline.{" "}
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
  const { t } = useTranslation();

  return (
    <section>
      <h2>{t("start.queue.recently_finished_builds")}</h2>
      <DashboardBuildList builds={builds} showDuration showStopAction={false} />
    </section>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
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
      <QuickLinks />
      {error ? <p>{t("spa.dashboard.load_error")}</p> : null}
      {isLoading ? <p>{t("spa.loading")}</p> : null}
      <div id="queue">
        <BuildQueueWidget builds={data.queue} />
        <WorkerStatusWidget workers={data.workers} />
        <RecentBuildsWidget builds={data.recent_builds} />
      </div>
    </>
  );
}
