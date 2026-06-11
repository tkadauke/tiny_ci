import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
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
  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<User[]>("/api/users"),
  });

  return (
    <div className="react-page">
      <p>
        You are here: <Link to="/">Home</Link> &gt; Users
      </p>
      <h1>Listing Users</h1>

      {usersQuery.isPending ? <p>Loading users...</p> : null}
      {usersQuery.isError ? (
        <div className="error" role="alert">
          Could not load users.
        </div>
      ) : null}

      {usersQuery.data?.length === 0 ? (
        <>
          <p>There are no user accounts yet.</p>
          {currentUser.can_create_accounts ? (
            <p>
              <a href="/signup">Create first administrator account</a>
            </p>
          ) : null}
        </>
      ) : null}

      {usersQuery.data && usersQuery.data.length > 0 ? (
        <>
          <table className="list">
            <thead>
              <tr>
                <th>Login name</th>
                <th>Options</th>
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
                      <Link to={`/users/${encodeURIComponent(user.login)}/edit`}>Edit</Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {currentUser.can_create_accounts ? (
            <p>
              <a href="/signup">New Account</a>
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
