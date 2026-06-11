type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
type QueryClientLike = {
  invalidateQueries: (queryKey: unknown[]) => unknown;
};

export let queryClient: QueryClientLike | undefined;

let csrfToken: string | undefined;

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

  if (response.status === 401) {
    queryClient?.invalidateQueries(["currentUser"]);
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
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
