import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import RequireAuth from "@/components/auth/RequireAuth";
import { FlashProvider, useFlash } from "@/components/ui/FlashMessage";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { CurrentUser, LoggedInCurrentUser } from "@/hooks/useCurrentUser";
import { setQueryClient } from "@/lib/api";
import { DashboardPage } from "@/pages/DashboardPage";
import AdminConfigPage from "@/pages/admin/AdminConfigPage";
import EditSlavePage from "@/pages/admin/EditSlavePage";
import NewSlavePage from "@/pages/admin/NewSlavePage";
import SlaveShowPage from "@/pages/admin/SlaveShowPage";
import SlavesPage from "@/pages/admin/SlavesPage";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import { BuildDetailPage } from "@/pages/builds/BuildDetailPage";
import { BuildHistoryPage } from "@/pages/builds/BuildHistoryPage";
import { HelpTopicPage } from "@/pages/help/HelpTopicPage";
import AllPlansPage from "@/pages/plans/AllPlansPage";
import EditPlanPage from "@/pages/plans/EditPlanPage";
import NewPlanPage from "@/pages/plans/NewPlanPage";
import PlanShowPage from "@/pages/plans/PlanShowPage";
import ProjectPlansPage from "@/pages/plans/ProjectPlansPage";
import SelectParentPage from "@/pages/plans/SelectParentPage";
import EditProjectPage from "@/pages/projects/EditProjectPage";
import NewProjectPage from "@/pages/projects/NewProjectPage";
import ProjectsPage from "@/pages/projects/ProjectsPage";
import SetupWizardApp from "@/pages/setup/SetupWizardApp";
import UserSettingsPage from "@/pages/settings/UserSettingsPage";
import EditUserPage from "@/pages/users/EditUserPage";
import UserProfilePage from "@/pages/users/UserProfilePage";
import UsersPage from "@/pages/users/UsersPage";
import { useProjects } from "@/hooks/projects/useProjects";

const queryClient = new QueryClient();
setQueryClient(queryClient);

const routes = [
  { path: "/", title: "Home", element: <DashboardPage /> },
  { path: "/login", title: "Login", element: <LoginRoute /> },
  { path: "/signup", title: "Signup", element: <SignupRoute /> },
  { path: "/settings", title: "Settings", element: <UserSettingsPage />, requireAuth: true },
  { path: "/users", title: "Users", element: <UsersRoute />, requireAuth: true },
  { path: "/users/:login", title: "User Profile", element: <UserProfileRoute /> },
  { path: "/users/:login/edit", title: "Edit User", element: <EditUserRoute />, requireAuth: true },
  { path: "/plans", title: "Plans", element: <AllPlansPage /> },
  { path: "/projects", title: "Projects", element: <ProjectsRoute /> },
  { path: "/projects/new", title: "New Project", element: <NewProjectPage />, requireAuth: true },
  { path: "/projects/:projectId/edit", title: "Edit Project", element: <EditProjectRoute />, requireAuth: true },
  { path: "/projects/:projectId/plans", title: "Project Plans", element: <ProjectPlansPage /> },
  { path: "/projects/:projectId/plans/new", title: "New Plan", element: <NewPlanPage />, requireAuth: true },
  { path: "/projects/:projectId/plans/:planId", title: "Plan", element: <PlanShowPage /> },
  { path: "/projects/:projectId/plans/:planId/edit", title: "Edit Plan", element: <EditPlanPage />, requireAuth: true },
  { path: "/projects/:projectId/plans/:planId/child", title: "Convert to Child", element: <SelectParentPage />, requireAuth: true },
  { path: "/projects/:projectId/plans/:planId/builds", title: "Builds", element: <BuildHistoryRoute /> },
  { path: "/projects/:projectId/plans/:planId/builds/:buildId", title: "Build", element: <BuildDetailRoute /> },
  { path: "/admin/slaves", title: "Slaves", element: <SlavesPage />, requireAuth: true },
  { path: "/admin/slaves/new", title: "New Slave", element: <NewSlavePage />, requireAuth: true },
  { path: "/admin/slaves/:name", title: "Slave", element: <SlaveShowRoute />, requireAuth: true },
  { path: "/admin/slaves/:name/edit", title: "Edit Slave", element: <EditSlaveRoute />, requireAuth: true },
  { path: "/admin/configuration", title: "Configuration", element: <AdminConfigPage />, requireAuth: true },
  { path: "/admin/setup", title: "Setup", element: <SetupWizardApp /> },
  { path: "/help_topics/*", title: "Help", element: <HelpTopicPage /> },
];

function isLoggedIn(currentUser: CurrentUser): currentUser is LoggedInCurrentUser {
  return !currentUser.guest;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <FlashProvider>
          <Layout>
            <Routes>
              {routes.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={
                    route.requireAuth ? (
                      <RequireAuth>{route.element}</RequireAuth>
                    ) : (
                      route.element
                    )
                  }
                />
              ))}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </FlashProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function LoginRoute() {
  const { setFlash } = useFlash();

  return (
    <LoginPage
      onFlash={(message, type = "notice") => {
        setFlash({ message, type });
      }}
    />
  );
}

function SignupRoute() {
  const { setFlash } = useFlash();

  return (
    <SignupPage
      onFlash={(message, type = "notice") => {
        setFlash({ message, type });
      }}
    />
  );
}

function UsersRoute() {
  const { data: currentUser } = useCurrentUser();

  if (!isLoggedIn(currentUser)) {
    return null;
  }

  return <UsersPage currentUser={currentUser} />;
}

function UserProfileRoute() {
  const { data: currentUser } = useCurrentUser();

  return <UserProfilePage currentUser={currentUser} />;
}

function EditUserRoute() {
  const { data: currentUser } = useCurrentUser();
  const { setFlash } = useFlash();

  if (!isLoggedIn(currentUser)) {
    return null;
  }

  return (
    <EditUserPage
      currentUser={currentUser}
      onFlash={(message, type = "notice") => {
        setFlash({ message, type });
      }}
    />
  );
}

function ProjectsRoute() {
  const { data: currentUser } = useCurrentUser();

  return <ProjectsPage can_create_projects={currentUser.can_create_projects} />;
}

function EditProjectRoute() {
  const { projectId = "" } = useParams();
  const { projects, loading, errors } = useProjects();
  const project = projects.find((candidate) => candidate.name === projectId);

  if (loading) return <p>Loading...</p>;
  if (errors.length > 0) return <p>{errors.join(", ")}</p>;
  if (!project) return <p>Project not found.</p>;

  return <EditProjectPage project={project} />;
}

type PlanDetail = {
  name: string;
};

function usePlan(projectId: string, planId: string) {
  return useQuery({
    queryKey: ["plan", projectId, planId],
    queryFn: async () => {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/plans/${encodeURIComponent(planId)}`,
        { headers: { Accept: "application/json" }, credentials: "same-origin" }
      );

      if (!response.ok) {
        throw new Error(`Plan failed with ${response.status}`);
      }

      return response.json() as Promise<PlanDetail>;
    },
    enabled: projectId.length > 0 && planId.length > 0,
  });
}

function BuildHistoryRoute() {
  const { projectId = "", planId = "" } = useParams();
  const { data: plan } = usePlan(projectId, planId);

  return (
    <BuildHistoryPage
      projectId={projectId}
      planId={planId}
      planName={plan?.name ?? planId}
      stopIconPath="/assets/icons/small/stopped.png"
    />
  );
}

function BuildDetailRoute() {
  const { projectId = "", planId = "", buildId = "" } = useParams();

  return <BuildDetailPage projectId={projectId} planId={planId} buildId={buildId} />;
}

function SlaveShowRoute() {
  const { name = "" } = useParams();

  return <SlaveShowPage name={name} />;
}

function EditSlaveRoute() {
  const { name = "" } = useParams();

  return <EditSlavePage name={name} />;
}

function NotFound() {
  return (
    <section>
      <h1>Not Found</h1>
      <p>The requested page could not be found.</p>
    </section>
  );
}
