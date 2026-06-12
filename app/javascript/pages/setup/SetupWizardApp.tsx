import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField, inputClassName } from "@/components/ui/FormField";

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
    <FormField label={label}>
      {description ? <p className="mb-2 text-sm text-gray-500">{description}</p> : null}
      <input
        className={inputClassName}
        id={`setup_${name}`}
        name={name}
        type={type}
        value={form[name]}
        onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))}
      />
    </FormField>
  );
}

function LanguageStep({ onChoose }: { onChoose: (language: string) => void }) {
  const [language, setLanguage] = useState("en");

  return (
    <Card>
      <CardHeader>TinyCI Setup</CardHeader>
      <CardBody>
      <p className="text-sm text-gray-600">Please choose your language</p>
      <p className="mb-4 text-sm text-gray-600">Bitte waehlen Sie Ihre Sprache</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onChoose(language);
        }}
      >
        <FormField label="Language">
          <select className={inputClassName} id="setup_language" value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </select>
        </FormField>
        <Button type="submit">Ok</Button>
      </form>
      </CardBody>
    </Card>
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
  const initialForm = useMemo(() => ({ ...DEFAULTS, ...defaults, db_password: "" }), [defaults]);
  const [form, setForm] = useState<SetupForm>(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  return (
    <Card>
      <CardHeader>Welcome to TinyCI</CardHeader>
      <CardBody>
      <p className="mb-4 text-sm text-gray-600">
        Please fill out the following information to get started with TinyCI. This is the minimal configuration necessary
        for the correct operation of TinyCI.
      </p>
      <h2 className="mb-3 text-base font-semibold text-gray-900">Database configuration</h2>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          await onSubmit(form);
          setSaving(false);
        }}
      >
        {error ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>Could not connect to the database. The following error message was received:</p>
            <p>
              <strong>{error}</strong>
            </p>
          </div>
        ) : null}
        <Field name="db_user" label="Database username" type="text" form={form} setForm={setForm} />
        <Field
          name="db_password"
          label="Database password"
          type="password"
          form={form}
          setForm={setForm}
          description="This password will be saved as plain text in config/database.yml."
        />
        <Field
          name="db_name"
          label="Database name"
          type="text"
          form={form}
          setForm={setForm}
          description="The database will be created if it does not exist."
        />
        <Field name="db_host" label="Database host" type="text" form={form} setForm={setForm} />
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save and restart"}
        </Button>
      </form>
      </CardBody>
    </Card>
  );
}

function RestartStep() {
  return (
    <section>
      <h1>TinyCI is restarting...</h1>
      <p>Please wait while TinyCI is restarting.</p>
      <p>
        In a few moments, you will be redirected to the start page. If not, <a href="/">please click here to get there</a>
        .
      </p>
    </section>
  );
}

export default function SetupWizardApp() {
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
        setError(responseError.error || "Could not load setup state.");
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
      setError((responseError as SetupResponse).error || "Could not connect to the database.");
    }
  };

  if (step === "loading") {
    return <p>Loading setup...</p>;
  }
  if (step === "choose_language") {
    return <LanguageStep onChoose={chooseLanguage} />;
  }
  if (step === "restart") {
    return <RestartStep />;
  }
  return <ConfigStep defaults={defaults} error={error} onSubmit={submitConfig} />;
}
