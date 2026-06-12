import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import ConfigOptionForm from "../../components/config/ConfigOptionForm";
import useAdminConfigOptions from "../../hooks/useAdminConfigOptions";
import useUpdateAdminConfig from "../../hooks/useUpdateAdminConfig";

export default function AdminConfigPage() {
  const { t } = useTranslation();
  const { options, loading, error, refetch } = useAdminConfigOptions();
  const { updateAdminConfig } = useUpdateAdminConfig();
  const [flash, setFlash] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<Error | null>(null);

  async function handleSubmit(values: Record<string, string>) {
    setFlash(null);
    setSubmitError(null);

    try {
      await updateAdminConfig(values);
      setFlash(t("flash.notice.updated_configuration"));
      await refetch();
    } catch (updateError) {
      setSubmitError(updateError instanceof Error ? updateError : new Error(t("spa.admin.configuration.update_error")));
    }
  }

  if (loading) return <p>{t("spa.admin.configuration.loading")}</p>;
  if (error) return <p className="error">{error.message}</p>;

  return (
    <>
      {flash ? <div id="flash" className="notice">{flash}</div> : null}
      {submitError ? <div id="flash" className="error">{submitError.message}</div> : null}
      <ConfigOptionForm options={options} onSubmit={handleSubmit} submitLabel={t("admin.configurations.show.update")} />
    </>
  );
}
