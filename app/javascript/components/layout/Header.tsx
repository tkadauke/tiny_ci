import { Link, useNavigate } from "react-router-dom";
import type { MouseEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

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
      setFlash({ type: "error", message: t("spa.flash.error.unable_to_log_out") });
      return;
    }

    const body = (await response.json()) as {
      flash?: { type: "notice" | "error"; message: string };
    };

    await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    setFlash(body.flash ?? { type: "notice", message: t("flash.notice.logged_out") });
    navigate("/");
  };

  return (
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
        {currentUser.guest ? (
          <ul className="action-list">
            <li>{t("layouts.guest_greeter")}</li>
            <li>
              <Link to="/login">{t("layouts.login")}</Link>
            </li>
            <li>
              <Link to="/signup">{t("layouts.signup")}</Link>
            </li>
          </ul>
        ) : (
          <ul className="action-list">
            <li>{t("layouts.user_greeter", { user: currentUser.login })}</li>
            <li>
              <Link to="/settings">{t("layouts.settings")}</Link>
            </li>
            <li>
              <a href="/logout" onClick={logout}>
                {t("layouts.logout")}
              </a>
            </li>
          </ul>
        )}
      </div>
      <div className="clearer"></div>
    </div>
  );
}
