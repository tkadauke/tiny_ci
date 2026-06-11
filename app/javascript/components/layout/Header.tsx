import { Link, useNavigate } from "react-router-dom";
import type { MouseEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useFlash } from "@/components/ui/FlashMessage";

function csrfToken() {
  return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? "";
}

export default function Header() {
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setFlash } = useFlash();

  const logout = async (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    const response = await fetch("/api/session", {
      method: "DELETE",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken(),
      },
    });

    if (!response.ok) {
      setFlash({ type: "error", message: "Unable to log out" });
      return;
    }

    const body = (await response.json()) as {
      flash?: { type: "notice" | "error"; message: string };
    };

    await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    setFlash(body.flash ?? { type: "notice", message: "Successfully logged out" });
    navigate("/");
  };

  return (
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
        {currentUser.guest ? (
          <ul className="action-list">
            <li>Welcome, Guest!</li>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/signup">Signup</Link>
            </li>
          </ul>
        ) : (
          <ul className="action-list">
            <li>Welcome, {currentUser.login}!</li>
            <li>
              <Link to="/settings">Settings</Link>
            </li>
            <li>
              <a href="/logout" onClick={logout}>
                Logout
              </a>
            </li>
          </ul>
        )}
      </div>
      <div className="clearer"></div>
    </div>
  );
}
