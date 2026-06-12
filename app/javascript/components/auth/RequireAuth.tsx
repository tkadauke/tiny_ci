import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { data: currentUser, isLoading } = useCurrentUser();
  const location = useLocation();
  const { t } = useTranslation();

  if (isLoading) {
    return <p>{t("spa.loading")}</p>;
  }

  if (currentUser.guest) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
