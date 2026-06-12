import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function Navigation() {
  const { data: currentUser } = useCurrentUser();
  const { t } = useTranslation();

  return (
    <div id="menu_container">
      <div id="menu">
        <ul>
          <li>
            <Link to="/" className="first">
              {t("layouts.home")}
            </Link>
          </li>
          <li>
            <Link to="/plans">{t("layouts.all_plans")}</Link>
          </li>
          <li>
            <Link to="/projects">{t("layouts.projects")}</Link>
          </li>
          <li>
            <Link to="/users">{t("layouts.users")}</Link>
          </li>
          {currentUser.can_configure_workers ? (
            <li>
              <Link to="/admin/workers">Workers</Link>
            </li>
          ) : null}
          {currentUser.can_configure_system_variables ? (
            <li>
              <Link to="/admin/configuration">{t("layouts.configuration")}</Link>
            </li>
          ) : null}
          <li>
            <Link to="/help_topics">{t("layouts.help")}</Link>
          </li>
        </ul>
      </div>
      <div className="clearer"></div>
    </div>
  );
}
