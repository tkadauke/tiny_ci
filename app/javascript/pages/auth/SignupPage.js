import React, { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useCreateUser } from "hooks/useCreateUser";
import { queryClient } from "lib/queryClient";
import { storeFlash } from "lib/flash";

const initialForm = {
  login: "",
  email: "",
  password: "",
  password_confirmation: ""
};

function errorMessages(error) {
  if (Array.isArray(error?.errors)) return error.errors;
  if (Array.isArray(error?.body?.errors)) return error.body.errors;
  return [];
}

function SignupForm() {
  const [form, setForm] = useState(initialForm);
  const createUser = useCreateUser();
  const errors = errorMessages(createUser.error);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function submit(event) {
    event.preventDefault();
    createUser.mutate(form, {
      onSuccess: () => {
        queryClient.invalidateQueries(["currentUser"]);
        storeFlash("notice", "Successfully created account");
        window.location.assign("/");
      }
    });
  }

  return React.createElement(
    "form",
    { action: "/users", method: "post", onSubmit: submit },
    errors.length > 0 &&
      React.createElement(
        "div",
        { id: "errorExplanation", className: "errorExplanation" },
        React.createElement("h2", null, "Could not create account"),
        React.createElement(
          "ul",
          null,
          errors.map((message) => React.createElement("li", { key: message }, message))
        )
      ),
    React.createElement(
      "p",
      { className: "form_item" },
      React.createElement("span", { className: "label" }, React.createElement("label", { htmlFor: "user_login" }, "Login name")),
      React.createElement("span", { className: "desc" }, "The nick name used for logins"),
      React.createElement("input", { id: "user_login", name: "login", type: "text", value: form.login, onChange: updateField })
    ),
    React.createElement(
      "p",
      { className: "form_item" },
      React.createElement("span", { className: "label" }, React.createElement("label", { htmlFor: "user_email" }, "Email address")),
      React.createElement("span", { className: "desc" }, "The email address is used for notifications"),
      React.createElement("input", { id: "user_email", name: "email", type: "text", value: form.email, onChange: updateField })
    ),
    React.createElement(
      "p",
      { className: "form_item" },
      React.createElement("span", { className: "label" }, React.createElement("label", { htmlFor: "user_password" }, "Password")),
      React.createElement("input", { id: "user_password", name: "password", type: "password", value: form.password, onChange: updateField })
    ),
    React.createElement(
      "p",
      { className: "form_item" },
      React.createElement("span", { className: "label" }, React.createElement("label", { htmlFor: "user_password_confirmation" }, "Password confirmation")),
      React.createElement("span", { className: "desc" }, "Please repeat the password exactly as above"),
      React.createElement("input", { id: "user_password_confirmation", name: "password_confirmation", type: "password", value: form.password_confirmation, onChange: updateField })
    ),
    React.createElement("input", { type: "submit", value: createUser.isPending ? "Creating account..." : "Create account", disabled: createUser.isPending })
  );
}

export function mountSignupPage() {
  const root = document.getElementById("signup-page-root");
  if (!root || root.dataset.mounted === "true") return;

  root.dataset.mounted = "true";

  import("react-dom/client").then(({ createRoot }) => {
    createRoot(root).render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(SignupForm)
      )
    );

    const legacyForm = root.nextElementSibling;
    if (legacyForm?.tagName === "FORM") legacyForm.hidden = true;
  });
}

export default SignupForm;
