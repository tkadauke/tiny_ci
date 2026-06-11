import { useMutation } from "@tanstack/react-query";
import { api } from "lib/api";

export function useCreateUser() {
  return useMutation({
    mutationFn: (user) => api.post("/api/users", user)
  });
}
