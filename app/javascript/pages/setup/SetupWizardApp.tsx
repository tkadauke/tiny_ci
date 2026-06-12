import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type SetupStep = "loading" | "choose_language" | "config" | "restart";

type SetupForm = {
  db_user: string;
  db_password: string;
  db_name: string;
  db_host: string;
};

type SetupResponse = {
  step?: SetupStep;
  defaults?: Partial<SetupForm>;
  ready?: boolean;
  error?: string;
};

const DEFAULTS: SetupForm = {
  db_user: "root",
  db_password: "",
  db_name: "tiny_ci_production",
  db_host: "localhost",
};

function csrfToken() {
  return document.querySelector<HTMLMetaElement>("meta[name='csrf-token']")?.content;
}

async function fetchJson(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(csrfToken() ? { "X-CSRF-Token": csrfToken() } : {}),
      ...options.headers,
    },
    ...options,
  });
  const data = (await response.json()) as SetupResponse;
  if (!response.ok) {
    throw data;
  }
  return data;
}

function Field({
  name,
  label,
  type,
  form,
  setForm,
  description,
}: {
  name: keyof SetupForm;
  label: string;
  type: string;
  form: SetupForm;
  setForm: React.Dispatch<React.SetStateAction<SetupForm>>;
  description?: string;
}) {
  return (
    <p className="form_item">
      <span className="label">
        <label htmlFor={`setup_${name}`}>{label}</label>
      </span>
      {description ? <span className="desc">{description}</span> : null}
      <input
        id={`setup_${name}`}
        name={name}
        type={type}
        value={form[name]}
        onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))}
      />
    </p>
  );
}

function LanguageStep({ onChoose }: { onChoose: (language: string) => void }) {
  const { t } = useTranslation();
  const [language, setLanguage] = useState("en");

  return (
    <section>
      <h1>{t("spa.setup.title")}</h1>
      <p>{t("spa.setup.choose_language_en")}</p>
      <p>{t("spa.setup.choose_language_de")}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onChoose(language);
        }}
      >
        <p className="form_item">
          <span className="label">
            <label htmlFor="setup_language">{t("spa.setup.language")}</label>
          </span>
          <select id="setup_language" value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </select>
        </p>
        <button type="submit">{t("spa.setup.ok")}</button>
      </form>
    </section>
  );
}

function ConfigStep({
  defaults,
  onSubmit,
  error,
}: {
  defaults: Partial<SetupForm>;
  onSubmit: (form: SetupForm) => Promise<void>;
  error: string | null;
}) {
  const { t } = useTranslation();
  const initialForm = useMemo(() => ({ ...DEFAULTS, ...defaults, db_password: "" }), [defaults]);
  const [form, setForm] = useState<SetupForm>(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  return (
    <section>
      <h1>{t("admin.setup.index.welcome_to_tinyci")}</h1>
      <p>
        {t("spa.setup.config_intro")}
      </p>
      <h2>{t("admin.setup.index.database_configuration")}</h2>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          await onSubmit(form);
          setSaving(false);
        }}
      >
        {error ? (
          <div className="errorExplanation">
            <p>{t("admin.setup.index.db_error")}</p>
            <p>
              <strong>{error}</strong>
            </p>
          </div>
        ) : null}
        <Field name="db_user" label={t("admin.setup.index.database_username")} type="text" form={form} setForm={setForm} />
        <Field
          name="db_password"
          label={t("admin.setup.index.database_password")}
          type="password"
          form={form}
          setForm={setForm}
          description={t("admin.setup.index.password_description", { path: "config/database.yml" })}
        />
        <Field
          name="db_name"
          label={t("admin.setup.index.database_name")}
          type="text"
          form={form}
          setForm={setForm}
          description={t("admin.setup.index.database_name_description")}
        />
        <Field name="db_host" label={t("admin.setup.index.database_host")} type="text" form={form} setForm={setForm} />
        <button type="submit" disabled={saving}>
          {saving ? t("spa.setup.saving") : t("admin.setup.index.save_and_restart")}
        </button>
      </form>
    </section>
  );
}

function RestartStep() {
  const { t } = useTranslation();

  return (
    <section>
      <h1>{t("spa.setup.restarting_title")}</h1>
      <p>{t("spa.setup.restarting")}</p>
      <p>
        {t("spa.setup.redirect_prefix")} <a href="/">{t("spa.setup.redirect_link")}</a>.
      </p>
    </section>
  );
}

export default function SetupWizardApp() {
  const { t } = useTranslation();
  const startsOnRestart = window.location.pathname === "/admin/setup/restart";
  const [step, setStep] = useState<SetupStep>(startsOnRestart ? "restart" : "loading");
  const [defaults, setDefaults] = useState<Partial<SetupForm>>(DEFAULTS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (startsOnRestart) return undefined;

    let active = true;
    fetchJson("/admin/setup.json")
      .then((data) => {
        if (!active) return;
        setDefaults({ ...DEFAULTS, ...data.defaults });
        setStep(data.step ?? "config");
      })
      .catch((responseError: SetupResponse) => {
        if (!active) return;
        setError(responseError.error || t("spa.setup.load_error"));
        setStep("config");
      });

    return () => {
      active = false;
    };
  }, [startsOnRestart]);

  useEffect(() => {
    if (step !== "restart") return undefined;

    const poll = () => {
      fetchJson("/admin/setup/redirect.json")
        .then((data) => {
          if (data.ready) {
            window.location.assign("/");
          }
        })
        .catch(() => {});
    };

    const timer = window.setInterval(poll, 5000);
    return () => window.clearInterval(timer);
  }, [step]);

  const chooseLanguage = (language: string) => {
    fetchJson(`/admin/setup.json?language=${encodeURIComponent(language)}`).then((data) => {
      setDefaults({ ...DEFAULTS, ...data.defaults });
      setStep("config");
    });
  };

  const submitConfig = async (form: SetupForm) => {
    setError(null);
    try {
      await fetchJson("/admin/setup.json", {
        method: "POST",
        body: JSON.stringify({ config: form }),
      });
      setStep("restart");
      await fetchJson("/admin/setup/restart.json");
    } catch (responseError) {
      setError((responseError as SetupResponse).error || t("flash.error.connect_to_database"));
    }
  };

  if (step === "loading") {
    return <p>{t("spa.setup.loading")}</p>;
  }
  if (step === "choose_language") {
    return <LanguageStep onChoose={chooseLanguage} />;
  }
  if (step === "restart") {
    return <RestartStep />;
  }
  return <ConfigStep defaults={defaults} error={error} onSubmit={submitConfig} />;
}
