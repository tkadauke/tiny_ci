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

  const logout = async (event: MouseEvent<HTMLButtonElement>) => {
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
    <header className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div>
          <Link to="/" className="text-lg font-semibold tracking-tight text-white hover:text-blue-300">
            TinyCI
          </Link>
          <p className="sr-only">{t("layouts.subtitle")}</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {currentUser.guest ? (
            <>
              <span className="text-slate-400">{t("layouts.guest_greeter")}</span>
              <Link to="/login" className="text-white hover:text-blue-300">
                {t("layouts.login")}
              </Link>
              <Link to="/signup" className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-white font-medium">
                {t("layouts.signup")}
              </Link>
            </>
          ) : (
            <>
              <span className="text-slate-300">{t("layouts.user_greeter", { user: currentUser.login })}</span>
              <Link to="/settings" className="text-slate-300 hover:text-white">
                {t("layouts.settings")}
              </Link>
              <button type="button" onClick={logout} className="text-slate-300 hover:text-white">
                {t("layouts.logout")}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
