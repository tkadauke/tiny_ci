import { useCallback, useEffect, useState } from "react";

import type { ConfigOption } from "../components/config/ConfigOptionForm";

type UserSettingsOptionsState = {
  options: ConfigOption[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export default function useUserSettingsOptions(): UserSettingsOptionsState {
  const [options, setOptions] = useState<ConfigOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/settings/options", {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to load user settings options (${response.status})`);
      }

      setOptions(await response.json());
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError : new Error("Failed to load user settings options"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { options, loading, error, refetch };
}
