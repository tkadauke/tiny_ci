import { useQuery } from "@tanstack/react-query";

export type CurrentUser = {
  guest: boolean;
  login: string | null;
  role: string;
  initial_admin: boolean;
  can_configure_slaves: boolean;
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
  role: "guest",
  initial_admin: false,
  can_configure_slaves: false,
  can_configure_system_variables: false,
  can_create_accounts: false,
  can_create_projects: false,
  can_edit_projects: false,
  can_create_plans: false,
  can_edit_plans: false,
  can_destroy_plans: false,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () =>
      fetch("/api/me", {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      }).then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load current user");
        }

        return response.json() as Promise<CurrentUser>;
      }),
    initialData: guestUser,
  });
}
