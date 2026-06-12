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
  workers: "Workers",
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
    <p>
      You are here:{" "}
      {crumbs.map((crumb, index) => (
        <span key={crumb.path}>
          {index > 0 ? " / " : null}
          {index === crumbs.length - 1 ? crumb.label : <Link to={crumb.path}>{crumb.label}</Link>}
        </span>
      ))}
    </p>
  );
}
