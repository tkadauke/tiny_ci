import { FormEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField, inputClassName } from "@/components/ui/FormField";
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
    <div className="mx-auto mt-16 max-w-sm">
      <Card>
        <CardHeader>Login</CardHeader>
        <CardBody>
      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}
      <form onSubmit={handleSubmit}>
        <FormField label="User name">
          <input
            className={inputClassName}
            id="login"
            name="login"
            type="text"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            autoComplete="username"
          />
        </FormField>
        <FormField label="Password">
          <input
            className={inputClassName}
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </FormField>
        <p className="mb-4">
          <label className="flex items-center gap-2 text-sm text-gray-700" htmlFor="remember_me">
            <input
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
          <Button type="submit" disabled={loginMutation.isPending}>
            Login
          </Button>
        </p>
      </form>
        </CardBody>
      </Card>
    </div>
  );
}
