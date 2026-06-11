import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { CurrentUser } from "./useCurrentUser";

export type LoginCredentials = {
  login: string;
  password: string;
};

export function useLogin() {
  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      api.post<CurrentUser>("/api/session", credentials),
  });
}
