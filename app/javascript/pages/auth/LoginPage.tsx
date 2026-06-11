import { FormEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { useLogin } from "../../hooks/useLogin";

type LoginPageProps = {
  onFlash: (message: string, type?: "notice" | "error") => void;
};

export default function LoginPage({ onFlash }: LoginPageProps) {
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
      onFlash("Successfully logged in");
      window.location.assign("/");
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Invalid login or password");
    }
  }

  return (
    <div className="react-page">
      <p>You are here: <a href="/">Home</a> &gt; Login</p>
      <h2>Login</h2>
      {error ? (
        <div className="error" role="alert">
          {error}
        </div>
      ) : null}
      <form className="form" onSubmit={handleSubmit}>
        <p>
          <label htmlFor="login">User name</label>
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
          <label htmlFor="password">Password</label>
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
            Remember me
          </label>
        </p>
        <p>
          <button type="submit" disabled={loginMutation.isPending}>
            Login
          </button>
        </p>
      </form>
    </div>
  );
}
