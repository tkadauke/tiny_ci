import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type CurrentUser = {
  guest: boolean;
  login: string | null;
  email: string | null;
  role: string;
  initial_admin: boolean;
  can_configure_workers: boolean;
  can_configure_system_variables: boolean;
  can_create_accounts: boolean;
  can_create_projects: boolean;
  can_edit_projects: boolean;
  can_create_plans: boolean;
  can_edit_plans: boolean;
  can_destroy_plans: boolean;
};

const guestUser: CurrentUser = {
  guest: true,
  login: null,
  email: null,
  role: "guest",
  initial_admin: false,
  can_configure_workers: false,
  can_configure_system_variables: false,
  can_create_accounts: false,
  can_create_projects: false,
  can_edit_projects: false,
  can_create_plans: false,
  can_edit_plans: false,
  can_destroy_plans: false,
};

export type LoggedInCurrentUser = CurrentUser & {
  guest: false;
  login: string;
  email: string;
};

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () => api.get<CurrentUser>("/api/me"),
    initialData: guestUser,
  });
}
