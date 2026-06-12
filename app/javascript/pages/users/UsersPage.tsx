import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/Badge";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
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
    <>
      <PageHeader
        title="Listing Users"
        actions={
          currentUser.can_create_accounts ? (
            <Link className="text-sm text-blue-600 hover:text-blue-500" to="/signup">New Account</Link>
          ) : null
        }
      />

      {usersQuery.isPending ? <p>Loading users...</p> : null}
      {usersQuery.isError ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
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
          <Card>
            <CardBody>
          <Table>
            <thead>
              <tr>
                <Th>Login</Th>
                <Th>Role</Th>
                <Th>Options</Th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.data.map((user) => (
                <Tr key={user.login}>
                  <Td>
                    <Link to={`/users/${encodeURIComponent(user.login)}`}>{user.login}</Link>
                  </Td>
                  <Td><StatusBadge status={user.role} /></Td>
                  <Td>
                    {canEditUser(currentUser, user) ? (
                      <Link to={`/users/${encodeURIComponent(user.login)}/edit`}>Edit</Link>
                    ) : null}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
            </CardBody>
          </Card>
        </>
      ) : null}
    </>
  );
}
