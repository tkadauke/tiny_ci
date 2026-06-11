import { Link, useParams } from "react-router-dom";
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
  const { login } = useParams();
  const userQuery = useUser(login);

  return (
    <div className="react-page">
      <p>
        You are here: <Link to="/">Home</Link> &gt; <Link to="/users">Users</Link> &gt;{" "}
        {login}
      </p>

      {userQuery.isPending ? <p>Loading profile...</p> : null}
      {userQuery.isError ? (
        <div className="error" role="alert">
          Could not load profile.
        </div>
      ) : null}

      {userQuery.data ? (
        <>
          <h2>{userQuery.data.login}'s Profile</h2>
          <ul className="action-list">
            {canEditProfile(currentUser, userQuery.data.login) ? (
              <li>
                <Link to={`/users/${encodeURIComponent(userQuery.data.login)}/edit`}>
                  Edit profile
                </Link>
              </li>
            ) : null}
          </ul>
        </>
      ) : null}
    </div>
  );
}
