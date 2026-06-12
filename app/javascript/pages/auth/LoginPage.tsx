import { FormEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/lib/api";
import { useLogin } from "../../hooks/useLogin";

type LoginPageProps = {
  onFlash: (message: string, type?: "notice" | "error") => void;
};

export default function LoginPage({ onFlash }: LoginPageProps) {
  const { t } = useTranslation();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const loginMutation = useLogin();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await loginMutation.mutateAsync({ login, password });
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      onFlash(t("flash.notice.logged_in"));
      window.location.assign("/");
    } catch (error) {
      setError(error instanceof ApiError ? error.message : t("spa.auth.invalid_login"));
    }
  }

  return (
    <div className="react-page">
      <p>{t("spa.breadcrumbs.you_are_here")} <a href="/">{t("breadcrumb.home")}</a> &gt; {t("breadcrumb.login")}</p>
      <h2>{t("user_sessions.new.login")}</h2>
      {error ? (
        <div className="error" role="alert">
          {error}
        </div>
      ) : null}
      <form className="form" onSubmit={handleSubmit}>
        <p>
          <label htmlFor="login">{t("user_sessions.new.user_name")}</label>
          <input
            id="login"
            name="login"
            type="text"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            autoComplete="username"
          />
        </p>
        <p>
          <label htmlFor="password">{t("user_sessions.new.password")}</label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </p>
        <p>
          <label htmlFor="remember_me">
            <input
              id="remember_me"
              name="remember_me"
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            {t("user_sessions.new.remember_me")}
          </label>
        </p>
        <p>
          <button type="submit" disabled={loginMutation.isPending}>
            {t("user_sessions.new.login")}
          </button>
        </p>
      </form>
    </div>
  );
}
