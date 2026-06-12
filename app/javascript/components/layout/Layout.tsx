import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import Header from "@/components/layout/Header";
import Navigation from "@/components/layout/Navigation";
import FlashMessage from "@/components/ui/FlashMessage";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <Navigation />
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
        <FlashMessage />
        <Breadcrumbs />
        {children}
      </main>
      <footer className="border-t border-gray-200 py-4 text-center text-sm text-gray-400">
        <LinkList />
      </footer>
    </div>
  );
}

function LinkList() {
  const { t } = useTranslation();

  return (
    <>
      <Link to="/">{t("layouts.home")}</Link> · <Link to="/projects">{t("layouts.projects")}</Link> ·{" "}
      <Link to="/users">{t("layouts.users")}</Link>
    </>
  );
}
