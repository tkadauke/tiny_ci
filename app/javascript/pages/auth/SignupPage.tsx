import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateUser } from "@/hooks/useCreateUser";
import type { CreateUserInput } from "@/hooks/useCreateUser";

const initialForm: CreateUserInput = {
  login: "",
  email: "",
  password: "",
  password_confirmation: ""
};

function errorMessages(error: unknown): string[] {
  const candidate = error as { errors?: string[]; body?: { errors?: string[] } } | null;
  if (Array.isArray(candidate?.errors)) return candidate.errors;
  if (Array.isArray(candidate?.body?.errors)) return candidate.body.errors;
  return [];
}

type SignupPageProps = {
  onFlash: (message: string, type?: "notice" | "error") => void;
};

export default function SignupPage({ onFlash }: SignupPageProps) {
  const [form, setForm] = useState<CreateUserInput>(initialForm);
  const createUser = useCreateUser();
  const queryClient = useQueryClient();
  const errors = errorMessages(createUser.error);

  function updateField(event: ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createUser.mutate(form, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        onFlash("Successfully created account");
        window.location.assign("/");
      }
    });
  }

  return (
    <div className="react-page">
      <h2>Create New Account</h2>
      <form action="/users" method="post" onSubmit={submit}>
        {errors.length > 0 && (
          <div id="errorExplanation" className="errorExplanation">
            <h2>Could not create account</h2>
            <ul>
              {errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="form_item">
          <span className="label">
            <label htmlFor="user_login">Login name</label>
          </span>
          <span className="desc">The nick name used for logins</span>
          <input id="user_login" name="login" type="text" value={form.login} onChange={updateField} />
        </p>

        <p className="form_item">
          <span className="label">
            <label htmlFor="user_email">Email address</label>
          </span>
          <span className="desc">The email address is used for notifications</span>
          <input id="user_email" name="email" type="text" value={form.email} onChange={updateField} />
        </p>

        <p className="form_item">
          <span className="label">
            <label htmlFor="user_password">Password</label>
          </span>
          <input id="user_password" name="password" type="password" value={form.password} onChange={updateField} />
        </p>

        <p className="form_item">
          <span className="label">
            <label htmlFor="user_password_confirmation">Password confirmation</label>
          </span>
          <span className="desc">Please repeat the password exactly as above</span>
          <input
            id="user_password_confirmation"
            name="password_confirmation"
            type="password"
            value={form.password_confirmation}
            onChange={updateField}
          />
        </p>

        <input type="submit" value={createUser.isPending ? "Creating account..." : "Create account"} disabled={createUser.isPending} />
      </form>
    </div>
  );
}
