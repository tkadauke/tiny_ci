import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const breadcrumbLabels: Record<string, string> = {
  admin: "breadcrumb.admin",
  builds: "breadcrumb.builds",
  child: "breadcrumb.child",
  configuration: "breadcrumb.configuration",
  edit: "breadcrumb.edit",
  help_topics: "breadcrumb.help_topics",
  login: "breadcrumb.login",
  new: "breadcrumb.new",
  plans: "breadcrumb.plans",
  projects: "breadcrumb.projects",
  settings: "breadcrumb.settings",
  signup: "layouts.signup",
  workers: "breadcrumb.workers",
  users: "breadcrumb.users",
};

function labelFor(segment: string, t: (key: string) => string) {
  const key = breadcrumbLabels[segment];
  return key ? t(key) : decodeURIComponent(segment);
}

export default function Breadcrumbs() {
  const location = useLocation();
  const { t } = useTranslation();
  const segments = location.pathname.split("/").filter(Boolean);
  const crumbs = [{ label: t("breadcrumb.home"), path: "/" }];

  segments.forEach((segment, index) => {
    crumbs.push({
      label: labelFor(segment, t),
      path: `/${segments.slice(0, index + 1).join("/")}`,
    });
  });

  return (
    <p>
      {t("spa.breadcrumbs.you_are_here")}{" "}
      {crumbs.map((crumb, index) => (
        <span key={crumb.path}>
          {index > 0 ? " / " : null}
          {index === crumbs.length - 1 ? crumb.label : <Link to={crumb.path}>{crumb.label}</Link>}
        </span>
      ))}
    </p>
  );
}
