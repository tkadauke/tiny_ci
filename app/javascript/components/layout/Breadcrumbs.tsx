import { Fragment } from "react";
import { Link, useLocation } from "react-router-dom";

const breadcrumbLabels: Record<string, string> = {
  admin: "Admin",
  builds: "Builds",
  child: "Convert to Child",
  configuration: "Configuration",
  edit: "Edit",
  help_topics: "Help",
  login: "Login",
  new: "New",
  plans: "Plans",
  projects: "Projects",
  settings: "Settings",
  signup: "Signup",
  slaves: "Workers",
  users: "Users",
};

function labelFor(segment: string) {
  return breadcrumbLabels[segment] ?? decodeURIComponent(segment);
}

export default function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  const crumbs = [{ label: "Home", path: "/" }];

  segments.forEach((segment, index) => {
    crumbs.push({
      label: labelFor(segment),
      path: `/${segments.slice(0, index + 1).join("/")}`,
    });
  });

  return (
    <nav className="mb-4 flex items-center gap-1.5 text-sm text-gray-500">
      {crumbs.map((crumb, index) => (
        <Fragment key={crumb.path}>
          {index > 0 && <span className="text-gray-300">/</span>}
          {index === crumbs.length - 1 ? (
            <span className="text-gray-900 font-medium">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="hover:text-gray-700">
              {crumb.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
