import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { CurrentUser } from "../hooks/useCurrentUser";

type HeaderProps = {
  currentUser?: CurrentUser;
  onFlash: (message: string, type?: "notice" | "error") => void;
};

export function Header({ currentUser, onFlash }: HeaderProps) {
  const queryClient = useQueryClient();
  const loggedIn = currentUser && !("guest" in currentUser && currentUser.guest);

  async function handleLogout() {
    await api.delete("/api/session");
    await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    onFlash("Successfully logged out");
    window.location.assign("/");
  }

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4">
        <div>
          <h1>
            <Link className="text-xl font-semibold text-gray-900" to="/">TinyCI</Link>
          </h1>
          <p className="text-sm text-gray-500">Continuous Integration for Ruby on Rails</p>
        </div>
        <div className="hidden text-sm text-gray-500 md:block">
                Found a bug? <a href="http://github.com/tkadauke/tiny_ci/issues">Report it!</a>
        </div>
        <div>
          {loggedIn ? (
            <ul className="flex items-center gap-3 text-sm">
              <li>Welcome, {currentUser.login}!</li>
              <li>
                <a href="/settings">Settings</a>
              </li>
              <li>
                <button type="button" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </ul>
          ) : (
            <ul className="flex items-center gap-3 text-sm">
              <li>Welcome, Guest!</li>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <a href="/users/new">Signup</a>
              </li>
            </ul>
          )}
        </div>
      </div>
      <div className="border-t border-gray-100">
        <nav className="mx-auto max-w-7xl px-4">
          <ul className="flex flex-wrap gap-4 py-3 text-sm">
            <li>
              <Link to="/">
                Home
              </Link>
            </li>
            <li>
              <a href="/plans">All Plans</a>
            </li>
            <li>
              <a href="/projects">Projects</a>
            </li>
            <li>
              <a href="/users">Users</a>
            </li>
            {loggedIn && currentUser.can_configure_workers ? (
              <li>
                <a href="/admin/workers">Workers</a>
              </li>
            ) : null}
            {loggedIn && currentUser.can_configure_system_variables ? (
              <li>
                <a href="/admin/configuration">Configuration</a>
              </li>
            ) : null}
            <li>
              <a href="/help_topics">Help</a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
