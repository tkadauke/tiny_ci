import { NavLink } from "react-router-dom";
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

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <ul className="flex gap-1 -mb-px">
          <li>
            <NavLink to="/" className={navLinkClass}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/plans" className={navLinkClass}>
              All Plans
            </NavLink>
          </li>
          <li>
            <NavLink to="/projects" className={navLinkClass}>
              Projects
            </NavLink>
          </li>
          <li>
            <NavLink to="/users" className={navLinkClass}>
              Users
            </NavLink>
          </li>
          {currentUser.can_configure_slaves ? (
            <li>
              <NavLink to="/admin/slaves" className={navLinkClass}>
                Workers
              </NavLink>
            </li>
          ) : null}
          {currentUser.can_configure_system_variables ? (
            <li>
              <NavLink to="/admin/configuration" className={navLinkClass}>
                Configuration
              </NavLink>
            </li>
          ) : null}
          <li>
            <NavLink to="/help_topics" className={navLinkClass}>
              Help
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}
