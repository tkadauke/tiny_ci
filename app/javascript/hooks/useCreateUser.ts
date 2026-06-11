import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";

export type CreateUserInput = {
  login: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export function useCreateUser() {
  return useMutation({
    mutationFn: (user: CreateUserInput) => api.post("/api/users", user)
  });
}
