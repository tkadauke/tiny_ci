type UpdateAdminConfigState = {
  updateAdminConfig: (values: Record<string, string>) => Promise<void>;
};

function csrfToken(): string | null {
  return document.querySelector<HTMLMetaElement>("meta[name='csrf-token']")?.content ?? null;
}

export default function useUpdateAdminConfig(): UpdateAdminConfigState {
  async function updateAdminConfig(values: Record<string, string>) {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    const token = csrfToken();

    if (token) headers["X-CSRF-Token"] = token;

    const response = await fetch("/api/admin/configuration", {
      method: "POST",
      headers,
      body: JSON.stringify({ config: values }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update configuration (${response.status})`);
    }
  }

  return { updateAdminConfig };
}
