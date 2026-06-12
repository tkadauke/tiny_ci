import { Link, useParams } from "react-router-dom";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/Badge";
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
    <>
      {userQuery.isPending ? <p>Loading profile...</p> : null}
      {userQuery.isError ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          Could not load profile.
        </div>
      ) : null}

      {userQuery.data ? (
        <>
          <PageHeader
            title={`${userQuery.data.login}'s Profile`}
            actions={canEditProfile(currentUser, userQuery.data.login) ? <Link className="text-sm text-blue-600 hover:text-blue-500" to={`/users/${encodeURIComponent(userQuery.data.login)}/edit`}>Edit profile</Link> : null}
          />
          <Card>
            <CardHeader>Profile info</CardHeader>
            <CardBody>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Login</dt>
                  <dd className="mt-1 text-sm text-gray-900">{userQuery.data.login}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1"><StatusBadge status={userQuery.data.role} /></dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{userQuery.data.email}</dd>
                </div>
              </dl>
            </CardBody>
          </Card>
        </>
      ) : null}
    </>
  );
}
