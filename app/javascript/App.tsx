import { ReactNode, useEffect, useRef, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FlashMessage } from "./components/FlashMessage";
import { Header } from "./components/Header";
import { CurrentUser, LoggedInCurrentUser, useCurrentUser } from "./hooks/useCurrentUser";
import LoginPage from "./pages/auth/LoginPage";
import EditUserPage from "./pages/users/EditUserPage";
import UserProfilePage from "./pages/users/UserProfilePage";
import UsersPage from "./pages/users/UsersPage";

const queryClient = new QueryClient();

function isLoggedIn(currentUser: CurrentUser | undefined): currentUser is LoggedInCurrentUser {
  return Boolean(currentUser && !("guest" in currentUser && currentUser.guest));
}

function isUsersReactRoute(pathname: string) {
  return (
    pathname === "/users" ||
    (pathname !== "/users/new" && /^\/users\/[^/]+(?:\/edit)?$/.test(pathname))
  );
}

type RequireAuthProps = {
  currentUser?: CurrentUser;
  onFlash: (message: string, type?: "notice" | "error") => void;
  children: (currentUser: LoggedInCurrentUser) => ReactNode;
};

function RequireAuth({ currentUser, onFlash, children }: RequireAuthProps) {
  const flashedLoginRequired = useRef(false);

  useEffect(() => {
    if (currentUser && !isLoggedIn(currentUser) && !flashedLoginRequired.current) {
      flashedLoginRequired.current = true;
      onFlash("Login required");
    }
  }, [currentUser, onFlash]);

  if (!currentUser) {
    return <p>Loading...</p>;
  }

  if (!isLoggedIn(currentUser)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children(currentUser)}</>;
}

function Shell() {
  const [flash, setFlash] = useState<{ message: string; type: "notice" | "error" } | null>(
    null,
  );
  const location = useLocation();
  const { data: currentUser } = useCurrentUser();
  const isReactRoute = location.pathname === "/login" || isUsersReactRoute(location.pathname);

  useEffect(() => {
    document.body.classList.toggle("react-route", isReactRoute);
  }, [isReactRoute]);

  function showFlash(message: string, type: "notice" | "error" = "notice") {
    setFlash({ message, type });
  }

  if (!isReactRoute) {
    return null;
  }

  return (
    <div id="wrap" className="react-shell">
      <div className="wrap_corner_right">
        <div id="topcontent">
          <div id="header">
            <Header currentUser={currentUser} onFlash={showFlash} />
          </div>
          <div id="body">
            <FlashMessage
              message={flash?.message ?? null}
              type={flash?.type}
              onClose={() => setFlash(null)}
            />
            <Routes>
              <Route path="/login" element={<LoginPage onFlash={showFlash} />} />
              <Route
                path="/users"
                element={
                  <RequireAuth currentUser={currentUser} onFlash={showFlash}>
                    {(loggedInUser) => <UsersPage currentUser={loggedInUser} />}
                  </RequireAuth>
                }
              />
              <Route
                path="/users/:login"
                element={<UserProfilePage currentUser={currentUser} />}
              />
              <Route
                path="/users/:login/edit"
                element={
                  <RequireAuth currentUser={currentUser} onFlash={showFlash}>
                    {(loggedInUser) => (
                      <EditUserPage currentUser={loggedInUser} onFlash={showFlash} />
                    )}
                  </RequireAuth>
                }
              />
            </Routes>
            <div className="clearer" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
