import { FormEvent, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { FormField, inputClassName } from "@/components/ui/FormField";
import { PageHeader } from "@/components/ui/PageHeader";
import type { LoggedInCurrentUser } from "../../hooks/useCurrentUser";
import { useUpdateUser } from "../../hooks/useUpdateUser";
import { useUser } from "../../hooks/useUser";
import { ApiError } from "../../lib/api";

type EditUserPageProps = {
  currentUser: LoggedInCurrentUser;
  onFlash: (message: string, type?: "notice" | "error") => void;
};

function canEditUser(currentUser: EditUserPageProps["currentUser"], login: string) {
  return currentUser.role === "admin" || currentUser.login === login;
}

function canEditRole(currentUser: EditUserPageProps["currentUser"], login: string) {
  return currentUser.role === "admin" && currentUser.login !== login;
}

export default function EditUserPage({ currentUser, onFlash }: EditUserPageProps) {
  const { login } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userQuery = useUser(login);
  const updateUser = useUpdateUser();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [errors, setErrors] = useState<string[]>([]);
  const flashedAccessDenied = useRef(false);

  useEffect(() => {
    if (userQuery.data) {
      setEmail(userQuery.data.email);
      setRole(userQuery.data.role);
    }
  }, [userQuery.data]);

  const unauthorized = userQuery.data
    ? !canEditUser(currentUser, userQuery.data.login)
    : false;

  useEffect(() => {
    if (unauthorized && !flashedAccessDenied.current) {
      flashedAccessDenied.current = true;
      onFlash("Access denied", "error");
    }
  }, [onFlash, unauthorized]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userQuery.data) {
      return;
    }

    setErrors([]);

    try {
      const updatedUser = await updateUser.mutateAsync({
        login: userQuery.data.login,
        email,
        role: canEditRole(currentUser, userQuery.data.login) ? role : undefined,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["users"] }),
        queryClient.invalidateQueries({ queryKey: ["user", userQuery.data.login] }),
        queryClient.invalidateQueries({ queryKey: ["user", updatedUser.login] }),
      ]);
      onFlash(`Successfully updated ${updatedUser.login}'s profile`);
      navigate(`/users/${encodeURIComponent(updatedUser.login)}`);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 403) {
          onFlash(error.message, "error");
          return;
        }

        if (error.errors.length > 0) {
          setErrors(error.errors);
          return;
        }
      }

      setErrors(["Could not update profile."]);
    }
  }

  return (
    <>
      {userQuery.isPending ? <p>Loading profile...</p> : null}
      {userQuery.isError ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          Could not load profile.
        </div>
      ) : null}
      {unauthorized ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          Access denied
        </div>
      ) : null}

      {userQuery.data && !unauthorized ? (
        <>
          <PageHeader title={`Edit ${userQuery.data.login}'s Profile`} />
          <Card>
            <CardBody>
          <form onSubmit={handleSubmit}>
            {errors.length > 0 ? (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                <p>Please fix the following errors:</p>
                <ul className="mt-2 list-disc pl-5">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <FormField label="E-Mail Address">
              <p className="mb-2 text-sm text-gray-500">The email address is used for notifications.</p>
              <input
                className={inputClassName}
                id="user_email"
                name="user[email]"
                type="text"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </FormField>

            {canEditRole(currentUser, userQuery.data.login) ? (
              <FormField label="Role">
                <p className="mb-2 text-sm text-gray-500">The user's role.</p>
                <select
                  className={inputClassName}
                  id="user_role"
                  name="user[role]"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </FormField>
            ) : null}

            <p className="flex items-center gap-3">
              <Button type="submit" disabled={updateUser.isPending}>
                Update
              </Button>
              <Link className="text-sm text-gray-600 hover:text-gray-900" to={`/users/${encodeURIComponent(userQuery.data.login)}`}>Cancel</Link>
            </p>
          </form>
            </CardBody>
          </Card>
        </>
      ) : null}
    </>
  );
}
