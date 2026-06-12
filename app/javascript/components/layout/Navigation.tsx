import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/hooks/useCurrentUser";

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `px-3 py-2.5 text-sm font-medium border-b-2 ${
    isActive
      ? "border-blue-600 text-blue-600"
      : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
  }`;
}

export default function Navigation() {
  const { data: currentUser } = useCurrentUser();
  const { t } = useTranslation();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <ul className="flex gap-1 -mb-px">
          <li>
            <NavLink to="/" className={navLinkClass}>
              {t("layouts.home")}
            </NavLink>
          </li>
          <li>
            <NavLink to="/plans" className={navLinkClass}>
              {t("layouts.all_plans")}
            </NavLink>
          </li>
          <li>
            <NavLink to="/projects" className={navLinkClass}>
              {t("layouts.projects")}
            </NavLink>
          </li>
          <li>
            <NavLink to="/users" className={navLinkClass}>
              {t("layouts.users")}
            </NavLink>
          </li>
          {currentUser.can_configure_workers ? (
            <li>
              <NavLink to="/admin/workers" className={navLinkClass}>
                {t("layouts.workers")}
              </NavLink>
            </li>
          ) : null}
          {currentUser.can_configure_system_variables ? (
            <li>
              <NavLink to="/admin/configuration" className={navLinkClass}>
                {t("layouts.configuration")}
              </NavLink>
            </li>
          ) : null}
          <li>
            <NavLink to="/help_topics" className={navLinkClass}>
              {t("layouts.help")}
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}
