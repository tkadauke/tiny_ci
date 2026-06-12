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
    <div id="react_header">
      <div id="top_header">
        <div id="logo">
          <h1>
            <Link to="/">TinyCI</Link>
          </h1>
          <p>Continuous Integration for Ruby on Rails</p>
        </div>
        <div id="center_header">
          <div id="suggestion">
            <div className="suggestion_corner_right">
              <span>
                Found a bug? <a href="http://github.com/tkadauke/tiny_ci/issues">Report it!</a>
              </span>
            </div>
          </div>
        </div>
        <div id="right_header">
          {loggedIn ? (
            <ul className="action-list">
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
            <ul className="action-list">
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
        <div className="clearer" />
      </div>
      <div id="menu_container">
        <div id="menu">
          <ul>
            <li>
              <Link to="/" className="first">
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
        </div>
        <div className="clearer" />
      </div>
    </div>
  );
}
