import React, { useState } from "react";

import ConfigOptionForm from "../../components/config/ConfigOptionForm";
import { PageHeader } from "@/components/ui/PageHeader";
import useUpdateUserSettings from "../../hooks/useUpdateUserSettings";
import useUserSettingsOptions from "../../hooks/useUserSettingsOptions";

export default function UserSettingsPage() {
  const { options, loading, error, refetch } = useUserSettingsOptions();
  const { updateUserSettings } = useUpdateUserSettings();
  const [flash, setFlash] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<Error | null>(null);

  async function handleSubmit(values: Record<string, string>) {
    setFlash(null);
    setSubmitError(null);

    try {
      await updateUserSettings(values);
      setFlash("Successfully updated configuration");
      await refetch();
    } catch (updateError) {
      setSubmitError(updateError instanceof Error ? updateError : new Error("Failed to update user settings"));
    }
  }

  if (loading) return <p>Loading settings...</p>;
  if (error) return <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error.message}</p>;

  return (
    <>
      <PageHeader title="User Settings" />
      {flash ? <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{flash}</div> : null}
      {submitError ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submitError.message}</div> : null}
      <ConfigOptionForm options={options} onSubmit={handleSubmit} submitLabel="Update" />
    </>
  );
}
