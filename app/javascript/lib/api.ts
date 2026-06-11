type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

let csrfToken: string | undefined;

export class ApiError extends Error {
  status: number;
  errors: string[];

  constructor(status: number, message: string, errors: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

async function getCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }

  const response = await fetch("/api/csrf", {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch CSRF token: ${response.status}`);
  }

  const payload: { token: string } = await response.json();
  csrfToken = payload.token;
  return payload.token;
}

async function request<TResponse>(
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<TResponse> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  const options: RequestInit = {
    method,
    credentials: "same-origin",
    headers,
  };

  if (method !== "GET") {
    headers["Content-Type"] = "application/json";
    headers["X-CSRF-Token"] = await getCsrfToken();
    options.body = JSON.stringify(body ?? {});
  }

  const response = await fetch(path, options);

  if (!response.ok) {
    let payload: { error?: string; errors?: string[] } = {};

    try {
      payload = await response.json();
    } catch {
      payload = {};
    }

    throw new ApiError(
      response.status,
      payload.error ?? `API request failed: ${response.status}`,
      payload.errors ?? [],
    );
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return response.json();
}

export const api = {
  get: <TResponse>(path: string): Promise<TResponse> => request<TResponse>("GET", path),
  post: <TResponse>(path: string, body: unknown): Promise<TResponse> =>
    request<TResponse>("POST", path, body),
  patch: <TResponse>(path: string, body: unknown): Promise<TResponse> =>
    request<TResponse>("PATCH", path, body),
  delete: <TResponse>(path: string): Promise<TResponse> =>
    request<TResponse>("DELETE", path),
};
