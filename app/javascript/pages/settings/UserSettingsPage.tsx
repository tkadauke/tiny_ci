import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import ConfigOptionForm from "../../components/config/ConfigOptionForm";
import useUpdateUserSettings from "../../hooks/useUpdateUserSettings";
import useUserSettingsOptions from "../../hooks/useUserSettingsOptions";

export default function UserSettingsPage() {
  const { t } = useTranslation();
  const { options, loading, error, refetch } = useUserSettingsOptions();
  const { updateUserSettings } = useUpdateUserSettings();
  const [flash, setFlash] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<Error | null>(null);

  async function handleSubmit(values: Record<string, string>) {
    setFlash(null);
    setSubmitError(null);

    try {
      await updateUserSettings(values);
      setFlash(t("flash.notice.updated_configuration"));
      await refetch();
    } catch (updateError) {
      setSubmitError(updateError instanceof Error ? updateError : new Error(t("spa.settings.update_error")));
    }
  }

  if (loading) return <p>{t("spa.settings.loading")}</p>;
  if (error) return <p className="error">{error.message}</p>;

  return (
    <>
      {flash ? <div id="flash" className="notice">{flash}</div> : null}
      {submitError ? <div id="flash" className="error">{submitError.message}</div> : null}
      <ConfigOptionForm options={options} onSubmit={handleSubmit} submitLabel={t("configurations.show.update")} />
    </>
  );
}
