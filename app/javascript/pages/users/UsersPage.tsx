import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { LoggedInCurrentUser } from "../../hooks/useCurrentUser";
import type { User } from "../../hooks/useUser";
import { api } from "../../lib/api";

type UsersPageProps = {
  currentUser: LoggedInCurrentUser;
};

function canEditUser(currentUser: UsersPageProps["currentUser"], user: User) {
  return currentUser.role === "admin" || currentUser.login === user.login;
}

export default function UsersPage({ currentUser }: UsersPageProps) {
  const { t } = useTranslation();
  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<User[]>("/api/users"),
  });

  return (
    <div className="react-page">
      <p>
        {t("spa.breadcrumbs.you_are_here")} <Link to="/">{t("breadcrumb.home")}</Link> &gt; {t("breadcrumb.users")}
      </p>
      <h1>{t("users.index.listing_users")}</h1>

      {usersQuery.isPending ? <p>{t("spa.users.loading")}</p> : null}
      {usersQuery.isError ? (
        <div className="error" role="alert">
          {t("spa.users.load_error")}
        </div>
      ) : null}

      {usersQuery.data?.length === 0 ? (
        <>
          <p>{t("users.index.there_are_no_user_accounts_yet")}</p>
          {currentUser.can_create_accounts ? (
            <p>
              <a href="/signup">{t("users.index.create_first_administrator_account")}</a>
            </p>
          ) : null}
        </>
      ) : null}

      {usersQuery.data && usersQuery.data.length > 0 ? (
        <>
          <table className="list">
            <thead>
              <tr>
                <th>{t("users.index.login_name")}</th>
                <th>{t("users.index.options")}</th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.data.map((user) => (
                <tr key={user.login}>
                  <td>
                    <Link to={`/users/${encodeURIComponent(user.login)}`}>{user.login}</Link>
                  </td>
                  <td>
                    {canEditUser(currentUser, user) ? (
                      <Link to={`/users/${encodeURIComponent(user.login)}/edit`}>{t("users.index.edit")}</Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {currentUser.can_create_accounts ? (
            <p>
              <a href="/signup">{t("users.index.new_account")}</a>
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
