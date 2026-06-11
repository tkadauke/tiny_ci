class ApiError extends Error {
  constructor(message, response, body) {
    super(message);
    this.name = "ApiError";
    this.response = response;
    this.body = body;
    this.errors = Array.isArray(body?.errors) ? body.errors : [];
  }
}

function csrfToken() {
  return document.querySelector("meta[name='csrf-token']")?.content;
}

async function request(method, path, data) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json"
  };
  const token = csrfToken();
  if (token) headers["X-CSRF-Token"] = token;

  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    headers,
    body: data === undefined ? undefined : JSON.stringify(data)
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(response.statusText || "Request failed", response, body);
  }

  return body;
}

export const api = {
  post(path, data) {
    return request("POST", path, data);
  }
};

export { ApiError };
