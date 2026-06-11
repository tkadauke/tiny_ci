import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FlashMessage } from "./components/FlashMessage";
import { Header } from "./components/Header";
import { useCurrentUser } from "./hooks/useCurrentUser";
import LoginPage from "./pages/auth/LoginPage";

const queryClient = new QueryClient();

function Shell() {
  const [flash, setFlash] = useState<{ message: string; type: "notice" | "error" } | null>(
    null,
  );
  const location = useLocation();
  const { data: currentUser } = useCurrentUser();
  const isReactRoute = location.pathname === "/login";

  useEffect(() => {
    document.body.classList.toggle("react-route", isReactRoute);
  }, [isReactRoute]);

  function showFlash(message: string, type: "notice" | "error" = "notice") {
    setFlash({ message, type });
  }

  if (!isReactRoute) {
    return null;
  }

  return (
    <div id="wrap" className="react-shell">
      <div className="wrap_corner_right">
        <div id="topcontent">
          <div id="header">
            <Header currentUser={currentUser} onFlash={showFlash} />
          </div>
          <div id="body">
            <FlashMessage
              message={flash?.message ?? null}
              type={flash?.type}
              onClose={() => setFlash(null)}
            />
            <Routes>
              <Route path="/login" element={<LoginPage onFlash={showFlash} />} />
            </Routes>
            <div className="clearer" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
