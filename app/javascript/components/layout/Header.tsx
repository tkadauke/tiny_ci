import { Link, useNavigate } from "react-router-dom";
import type { MouseEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useFlash } from "@/components/ui/FlashMessage";

function csrfToken() {
  return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? "";
}

export default function Header() {
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setFlash } = useFlash();

  const logout = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const response = await fetch("/api/session", {
      method: "DELETE",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken(),
      },
    });

    if (!response.ok) {
      setFlash({ type: "error", message: "Unable to log out" });
      return;
    }

    const body = (await response.json()) as {
      flash?: { type: "notice" | "error"; message: string };
    };

    await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    setFlash(body.flash ?? { type: "notice", message: "Successfully logged out" });
    navigate("/");
  };

  return (
    <header className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold tracking-tight text-white hover:text-blue-300">
          TinyCI
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {currentUser.guest ? (
            <>
              <span className="text-slate-400">Guest</span>
              <Link to="/login" className="text-white hover:text-blue-300">
                Log in
              </Link>
              <Link to="/signup" className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-white font-medium">
                Sign up
              </Link>
            </>
          ) : (
            <>
              <span className="text-slate-300">{currentUser.login}</span>
              <Link to="/settings" className="text-slate-300 hover:text-white">
                Settings
              </Link>
              <button type="button" onClick={logout} className="text-slate-300 hover:text-white">
                Log out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
