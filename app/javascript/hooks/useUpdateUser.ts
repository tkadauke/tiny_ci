import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { User } from "./useUser";

export type UpdateUserPayload = {
  login: string;
  email: string;
  role?: string;
};

export function useUpdateUser() {
  return useMutation({
    mutationFn: ({ login, ...user }: UpdateUserPayload) =>
      api.patch<User>(`/api/users/${encodeURIComponent(login)}`, { user }),
  });
}
