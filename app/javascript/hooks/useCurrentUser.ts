import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export type CurrentUser =
  | { guest: true }
  | {
      guest?: false;
      login: string;
      email: string;
      role: string;
      initial_admin: boolean;
      can_configure_slaves: boolean;
      can_configure_system_variables: boolean;
      can_create_accounts: boolean;
    };

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () => api.get<CurrentUser>("/api/me"),
  });
}
