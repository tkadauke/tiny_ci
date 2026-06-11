import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export type User = {
  login: string;
  email: string;
  role: string;
};

export function useUser(login: string | undefined) {
  return useQuery({
    queryKey: ["user", login],
    queryFn: () => api.get<User>(`/api/users/${encodeURIComponent(login ?? "")}`),
    enabled: Boolean(login),
  });
}
