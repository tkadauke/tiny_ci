import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import RequireAuth from "@/components/auth/RequireAuth";
import { FlashProvider, useFlash } from "@/components/ui/FlashMessage";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { CurrentUser, LoggedInCurrentUser } from "@/hooks/useCurrentUser";
import { setQueryClient } from "@/lib/api";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import EditUserPage from "@/pages/users/EditUserPage";
import UserProfilePage from "@/pages/users/UserProfilePage";
import UsersPage from "@/pages/users/UsersPage";

const queryClient = new QueryClient();
setQueryClient(queryClient);

const routes = [
  { path: "/", title: "Home" },
  { path: "/login", title: "Login", element: <LoginRoute /> },
  { path: "/signup", title: "Signup", element: <SignupRoute /> },
  { path: "/settings", title: "Settings", requireAuth: true },
  { path: "/users", title: "Users", element: <UsersRoute />, requireAuth: true },
  { path: "/users/:login", title: "User Profile", element: <UserProfileRoute /> },
  { path: "/users/:login/edit", title: "Edit User", element: <EditUserRoute />, requireAuth: true },
  { path: "/plans", title: "Plans" },
  { path: "/projects", title: "Projects" },
  { path: "/projects/new", title: "New Project", requireAuth: true },
  { path: "/projects/:projectId/edit", title: "Edit Project", requireAuth: true },
  { path: "/projects/:projectId/plans", title: "Project Plans" },
  { path: "/projects/:projectId/plans/new", title: "New Plan", requireAuth: true },
  { path: "/projects/:projectId/plans/:planId", title: "Plan" },
  { path: "/projects/:projectId/plans/:planId/edit", title: "Edit Plan", requireAuth: true },
  { path: "/projects/:projectId/plans/:planId/child", title: "Convert to Child", requireAuth: true },
  { path: "/projects/:projectId/plans/:planId/builds", title: "Builds" },
  { path: "/projects/:projectId/plans/:planId/builds/:buildId", title: "Build" },
  { path: "/admin/slaves", title: "Slaves", requireAuth: true },
  { path: "/admin/slaves/new", title: "New Slave", requireAuth: true },
  { path: "/admin/slaves/:name", title: "Slave", requireAuth: true },
  { path: "/admin/slaves/:name/edit", title: "Edit Slave", requireAuth: true },
  { path: "/admin/configuration", title: "Configuration", requireAuth: true },
  { path: "/admin/setup", title: "Setup" },
  { path: "/help_topics/*", title: "Help" },
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
                      <RequireAuth>{route.element ?? <Placeholder title={route.title} />}</RequireAuth>
                    ) : (
                      route.element ?? <Placeholder title={route.title} />
                    )
                  }
                />
              ))}
              <Route path="*" element={<Placeholder title="Not Found" />} />
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

function Placeholder({ title }: { title: string }) {
  const location = useLocation();

  return (
    <section>
      <h1>{title}</h1>
      <p>React placeholder for {location.pathname}</p>
    </section>
  );
}
