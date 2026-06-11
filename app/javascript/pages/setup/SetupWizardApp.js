import React, { useEffect, useMemo, useState } from "react"

const DEFAULTS = {
  db_user: "root",
  db_password: "",
  db_name: "tiny_ci_production",
  db_host: "localhost"
}

function csrfToken() {
  return document.querySelector("meta[name='csrf-token']")?.content
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(csrfToken() ? { "X-CSRF-Token": csrfToken() } : {}),
      ...options.headers
    },
    ...options
  })
  const data = await response.json()
  if (!response.ok) {
    throw data
  }
  return data
}

function field(name, label, type, form, setForm, extra) {
  return React.createElement(
    "p",
    { className: "form_item", key: name },
    React.createElement("span", { className: "label" }, React.createElement("label", { htmlFor: `setup_${name}` }, label)),
    extra,
    React.createElement("input", {
      id: `setup_${name}`,
      name,
      type,
      value: form[name],
      onChange: (event) => setForm((current) => ({ ...current, [name]: event.target.value }))
    })
  )
}

function LanguageStep({ onChoose }) {
  const [language, setLanguage] = useState("en")

  return React.createElement(
    "section",
    null,
    React.createElement("h1", null, "TinyCI Setup"),
    React.createElement("p", null, "Please choose your language"),
    React.createElement("p", null, "Bitte waehlen Sie Ihre Sprache"),
    React.createElement(
      "form",
      {
        onSubmit: (event) => {
          event.preventDefault()
          onChoose(language)
        }
      },
      React.createElement(
        "p",
        { className: "form_item" },
        React.createElement("span", { className: "label" }, React.createElement("label", { htmlFor: "setup_language" }, "Language")),
        React.createElement(
          "select",
          {
            id: "setup_language",
            value: language,
            onChange: (event) => setLanguage(event.target.value)
          },
          React.createElement("option", { value: "en" }, "English"),
          React.createElement("option", { value: "de" }, "Deutsch")
        )
      ),
      React.createElement("button", { type: "submit" }, "Ok")
    )
  )
}

function ConfigStep({ defaults, onSubmit, error }) {
  const initialForm = useMemo(() => ({ ...DEFAULTS, ...defaults, db_password: "" }), [defaults])
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(initialForm)
  }, [initialForm])

  return React.createElement(
    "section",
    null,
    React.createElement("h1", null, "Welcome to TinyCI"),
    React.createElement(
      "p",
      null,
      "Please fill out the following information to get started with TinyCI. This is the minimal configuration necessary for the correct operation of TinyCI."
    ),
    React.createElement("h2", null, "Database configuration"),
    React.createElement(
      "form",
      {
        onSubmit: async (event) => {
          event.preventDefault()
          setSaving(true)
          await onSubmit(form)
          setSaving(false)
        }
      },
      error
        ? React.createElement(
            "div",
            { className: "errorExplanation" },
            React.createElement("p", null, "Could not connect to the database. The following error message was received:"),
            React.createElement("p", null, React.createElement("strong", null, error))
          )
        : null,
      field("db_user", "Database username", "text", form, setForm),
      field(
        "db_password",
        "Database password",
        "password",
        form,
        setForm,
        React.createElement("span", { className: "desc" }, "This password will be saved as plain text in config/database.yml.")
      ),
      field(
        "db_name",
        "Database name",
        "text",
        form,
        setForm,
        React.createElement("span", { className: "desc" }, "The database will be created if it does not exist.")
      ),
      field("db_host", "Database host", "text", form, setForm),
      React.createElement("button", { type: "submit", disabled: saving }, saving ? "Saving..." : "Save and restart")
    )
  )
}

function RestartStep() {
  return React.createElement(
    "section",
    null,
    React.createElement("h1", null, "TinyCI is restarting..."),
    React.createElement("p", null, "Please wait while TinyCI is restarting."),
    React.createElement(
      "p",
      null,
      "In a few moments, you will be redirected to the start page. If not, ",
      React.createElement("a", { href: "/" }, "please click here to get there"),
      "."
    )
  )
}

export default function SetupWizardApp() {
  const startsOnRestart = window.location.pathname === "/admin/setup/restart"
  const [step, setStep] = useState(startsOnRestart ? "restart" : "loading")
  const [defaults, setDefaults] = useState(DEFAULTS)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (startsOnRestart) return

    let active = true
    fetchJson("/admin/setup.json")
      .then((data) => {
        if (!active) return
        setDefaults({ ...DEFAULTS, ...data.defaults })
        setStep(data.step)
      })
      .catch((responseError) => {
        if (!active) return
        setError(responseError.error || "Could not load setup state.")
        setStep("config")
      })

    return () => {
      active = false
    }
  }, [startsOnRestart])

  useEffect(() => {
    if (step !== "restart") return undefined

    const poll = () => {
      fetchJson("/admin/setup/redirect.json")
        .then((data) => {
          if (data.ready) {
            window.location.assign("/")
          }
        })
        .catch(() => {})
    }

    const timer = window.setInterval(poll, 5000)
    return () => window.clearInterval(timer)
  }, [step])

  const chooseLanguage = (language) => {
    fetchJson(`/admin/setup.json?language=${encodeURIComponent(language)}`).then((data) => {
      setDefaults({ ...DEFAULTS, ...data.defaults })
      setStep("config")
    })
  }

  const submitConfig = async (form) => {
    setError(null)
    try {
      await fetchJson("/admin/setup.json", {
        method: "POST",
        body: JSON.stringify({ config: form })
      })
      setStep("restart")
      await fetchJson("/admin/setup/restart.json")
    } catch (responseError) {
      setError(responseError.error || "Could not connect to the database.")
    }
  }

  if (step === "loading") {
    return React.createElement("p", null, "Loading setup...")
  }
  if (step === "choose_language") {
    return React.createElement(LanguageStep, { onChoose: chooseLanguage })
  }
  if (step === "restart") {
    return React.createElement(RestartStep)
  }
  return React.createElement(ConfigStep, { defaults, error, onSubmit: submitConfig })
}
