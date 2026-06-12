import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField, inputClassName } from "@/components/ui/FormField";
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
    <div className="mx-auto mt-16 max-w-sm">
      <Card>
        <CardHeader>Create New Account</CardHeader>
        <CardBody>
      <form action="/users" method="post" onSubmit={submit}>
        {errors.length > 0 && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="font-medium">Could not create account</p>
            <ul className="mt-2 list-disc pl-5">
              {errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <FormField label="Login Name">
          <p className="mb-2 text-sm text-gray-500">The nick name used for logins</p>
          <input className={inputClassName} id="user_login" name="login" type="text" value={form.login} onChange={updateField} />
        </FormField>

        <FormField label="E-Mail Address">
          <p className="mb-2 text-sm text-gray-500">The email address is used for notifications</p>
          <input className={inputClassName} id="user_email" name="email" type="text" value={form.email} onChange={updateField} />
        </FormField>

        <FormField label="Password">
          <input className={inputClassName} id="user_password" name="password" type="password" value={form.password} onChange={updateField} />
        </FormField>

        <FormField label="Password Confirmation">
          <p className="mb-2 text-sm text-gray-500">Please repeat the password exactly as above</p>
          <input
            className={inputClassName}
            id="user_password_confirmation"
            name="password_confirmation"
            type="password"
            value={form.password_confirmation}
            onChange={updateField}
          />
        </FormField>

        <Button type="submit" disabled={createUser.isPending}>{createUser.isPending ? "Creating account..." : "Create account"}</Button>
      </form>
        </CardBody>
      </Card>
    </div>
  );
}
