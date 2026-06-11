import { FormEvent, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
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
    <div className="react-page">
      <p>
        You are here: <Link to="/">Home</Link> &gt; <Link to="/users">Users</Link> &gt;{" "}
        {login} &gt; Edit
      </p>

      {userQuery.isPending ? <p>Loading profile...</p> : null}
      {userQuery.isError ? (
        <div className="error" role="alert">
          Could not load profile.
        </div>
      ) : null}
      {unauthorized ? (
        <div className="error" role="alert">
          Access denied
        </div>
      ) : null}

      {userQuery.data && !unauthorized ? (
        <>
          <h2>Edit {userQuery.data.login}'s Profile</h2>
          <form className="form" onSubmit={handleSubmit}>
            {errors.length > 0 ? (
              <div className="error" role="alert">
                <p>Please fix the following errors:</p>
                <ul>
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="form_item">
              <span className="label">
                <label htmlFor="user_email">Email address</label>
              </span>
              <span className="desc">The email address is used for notifications.</span>
              <input
                id="user_email"
                name="user[email]"
                type="text"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </p>

            {canEditRole(currentUser, userQuery.data.login) ? (
              <p className="form_item">
                <span className="label">
                  <label htmlFor="user_role">Role</label>
                </span>
                <span className="desc">The user's role.</span>
                <select
                  id="user_role"
                  name="user[role]"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </p>
            ) : null}

            <p>
              <button type="submit" disabled={updateUser.isPending}>
                Update
              </button>
            </p>
          </form>
        </>
      ) : null}
    </div>
  );
}
