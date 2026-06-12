import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
        onFlash(t("flash.notice.created_account"));
        window.location.assign("/");
      }
    });
  }

  return (
    <div className="react-page">
      <h2>{t("users.new.create_new_account")}</h2>
      <form action="/users" method="post" onSubmit={submit}>
        {errors.length > 0 && (
          <div id="errorExplanation" className="errorExplanation">
            <h2>{t("spa.users.create_error")}</h2>
            <ul>
              {errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="form_item">
          <span className="label">
            <label htmlFor="user_login">{t("users.new.login_name")}</label>
          </span>
          <span className="desc">{t("users.new.the_nick_name_used_for_logins")}</span>
          <input id="user_login" name="login" type="text" value={form.login} onChange={updateField} />
        </p>

        <p className="form_item">
          <span className="label">
            <label htmlFor="user_email">{t("users.new.email_address")}</label>
          </span>
          <span className="desc">{t("users.new.the_email_address_is_used_for_notifications")}</span>
          <input id="user_email" name="email" type="text" value={form.email} onChange={updateField} />
        </p>

        <p className="form_item">
          <span className="label">
            <label htmlFor="user_password">{t("users.new.password")}</label>
          </span>
          <input id="user_password" name="password" type="password" value={form.password} onChange={updateField} />
        </p>

        <p className="form_item">
          <span className="label">
            <label htmlFor="user_password_confirmation">{t("users.new.password_confirmation")}</label>
          </span>
          <span className="desc">{t("users.new.please_repeat_the_password_exactly_as_above")}</span>
          <input
            id="user_password_confirmation"
            name="password_confirmation"
            type="password"
            value={form.password_confirmation}
            onChange={updateField}
          />
        </p>

        <input type="submit" value={createUser.isPending ? t("spa.users.creating_account") : t("users.new.create_account")} disabled={createUser.isPending} />
      </form>
    </div>
  );
}
