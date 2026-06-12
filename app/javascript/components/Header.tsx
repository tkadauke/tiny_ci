import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import type { CurrentUser } from "../hooks/useCurrentUser";

type HeaderProps = {
  currentUser?: CurrentUser;
  onFlash: (message: string, type?: "notice" | "error") => void;
};

export function Header({ currentUser, onFlash }: HeaderProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const loggedIn = currentUser && !("guest" in currentUser && currentUser.guest);

  async function handleLogout() {
    await api.delete("/api/session");
    await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    onFlash(t("flash.notice.logged_out"));
    window.location.assign("/");
  }

  return (
    <div id="react_header">
      <div id="top_header">
        <div id="logo">
          <h1>
            <Link to="/">TinyCI</Link>
          </h1>
          <p>{t("layouts.subtitle")}</p>
        </div>
        <div id="center_header">
          <div id="suggestion">
            <div className="suggestion_corner_right">
              <span>
                {t("spa.layout.report_bugs_prefix")}{" "}
                <a href="http://github.com/tkadauke/tiny_ci/issues">{t("layouts.report_link_text")}</a>
              </span>
            </div>
          </div>
        </div>
        <div id="right_header">
          {loggedIn ? (
            <ul className="action-list">
              <li>{t("layouts.user_greeter", { user: currentUser.login })}</li>
              <li>
                <a href="/settings">{t("layouts.settings")}</a>
              </li>
              <li>
                <button type="button" onClick={handleLogout}>
                  {t("layouts.logout")}
                </button>
              </li>
            </ul>
          ) : (
            <ul className="action-list">
              <li>{t("layouts.guest_greeter")}</li>
              <li>
                <Link to="/login">{t("layouts.login")}</Link>
              </li>
              <li>
                <a href="/users/new">{t("layouts.signup")}</a>
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
                {t("layouts.home")}
              </Link>
            </li>
            <li>
              <a href="/plans">{t("layouts.all_plans")}</a>
            </li>
            <li>
              <a href="/projects">{t("layouts.projects")}</a>
            </li>
            <li>
              <a href="/users">{t("layouts.users")}</a>
            </li>
            {loggedIn && currentUser.can_configure_workers ? (
              <li>
                <a href="/admin/workers">Workers</a>
              </li>
            ) : null}
            {loggedIn && currentUser.can_configure_system_variables ? (
              <li>
                <a href="/admin/configuration">{t("layouts.configuration")}</a>
              </li>
            ) : null}
            <li>
              <a href="/help_topics">{t("layouts.help")}</a>
            </li>
          </ul>
        </div>
        <div className="clearer" />
      </div>
    </div>
  );
}
