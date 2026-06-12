import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { CurrentUser } from "../../hooks/useCurrentUser";
import { useUser } from "../../hooks/useUser";

type UserProfilePageProps = {
  currentUser?: CurrentUser;
};

function canEditProfile(currentUser: CurrentUser | undefined, login: string) {
  if (!currentUser || ("guest" in currentUser && currentUser.guest)) {
    return false;
  }

  return currentUser.role === "admin" || currentUser.login === login;
}

export default function UserProfilePage({ currentUser }: UserProfilePageProps) {
  const { t } = useTranslation();
  const { login } = useParams();
  const userQuery = useUser(login);

  return (
    <div className="react-page">
      <p>
        {t("spa.breadcrumbs.you_are_here")} <Link to="/">{t("breadcrumb.home")}</Link> &gt; <Link to="/users">{t("breadcrumb.users")}</Link> &gt;{" "}
        {login}
      </p>

      {userQuery.isPending ? <p>{t("spa.users.loading_profile")}</p> : null}
      {userQuery.isError ? (
        <div className="error" role="alert">
          {t("spa.users.load_profile_error")}
        </div>
      ) : null}

      {userQuery.data ? (
        <>
          <h2>{t("users.show.users_profile", { login: userQuery.data.login })}</h2>
          <ul className="action-list">
            {canEditProfile(currentUser, userQuery.data.login) ? (
              <li>
                <Link to={`/users/${encodeURIComponent(userQuery.data.login)}/edit`}>
                  {t("users.show.edit_profile")}
                </Link>
              </li>
            ) : null}
          </ul>
        </>
      ) : null}
    </div>
  );
}
