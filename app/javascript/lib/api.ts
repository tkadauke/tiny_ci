type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
type QueryClientLike = {
  invalidateQueries: (filters: { queryKey: unknown[] }) => unknown;
};

export let queryClient: QueryClientLike | undefined;

let csrfToken: string | undefined;

export class ApiError extends Error {
  response: Response;
  body: unknown;
  errors: string[];

  constructor(message: string, response: Response, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.response = response;
    this.body = body;
    this.errors = isErrorBody(body) ? body.errors : [];
  }
}

export function setQueryClient(client: QueryClientLike): void {
  queryClient = client;
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
  const text = await response.text();
  const responseBody = text ? JSON.parse(text) : undefined;

  if (response.status === 401) {
    queryClient?.invalidateQueries({ queryKey: ["currentUser"] });
  }

  if (!response.ok) {
    throw new ApiError(`API request failed: ${response.status}`, response, responseBody);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return responseBody as TResponse;
}

function isErrorBody(body: unknown): body is { errors: string[] } {
  return (
    typeof body === "object" &&
    body !== null &&
    "errors" in body &&
    Array.isArray((body as { errors?: unknown }).errors)
  );
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
