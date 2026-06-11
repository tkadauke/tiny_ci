import { Link } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function Navigation() {
  const { data: currentUser } = useCurrentUser();

  return (
    <div id="menu_container">
      <div id="menu">
        <ul>
          <li>
            <Link to="/" className="first">
              Home
            </Link>
          </li>
          <li>
            <Link to="/plans">All Plans</Link>
          </li>
          <li>
            <Link to="/projects">Projects</Link>
          </li>
          <li>
            <Link to="/users">Users</Link>
          </li>
          {currentUser.can_configure_slaves ? (
            <li>
              <Link to="/admin/slaves">Slaves</Link>
            </li>
          ) : null}
          {currentUser.can_configure_system_variables ? (
            <li>
              <Link to="/admin/configuration">Configuration</Link>
            </li>
          ) : null}
          <li>
            <Link to="/help_topics">Help</Link>
          </li>
        </ul>
      </div>
      <div className="clearer"></div>
    </div>
  );
}
