import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import Header from "@/components/layout/Header";
import Navigation from "@/components/layout/Navigation";
import FlashMessage from "@/components/ui/FlashMessage";

export default function Layout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <>
      <div id="wrap">
        <div className="wrap_corner_right">
          <div id="topcontent">
            <div id="header">
              <Header />
              <Navigation />
            </div>

            <div id="body">
              <FlashMessage />
              <Breadcrumbs />
              {children}
              <div className="clearer"></div>
            </div>
          </div>

          <div id="bottomcontent">
            <div className="bottomcontent_right">
              <div id="footer">
                <div className="footer_corner_right">
                  <div className="left">
                    <LinkList />
                  </div>
                  <div className="clearer"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bottom_space">
        <div id="ads_page_end">
          <h1>{t("layouts.quick_links")}</h1>
          <div id="links">
            <a href="http://github.com/tkadauke/tiny_ci">{t("layouts.github_project_page")}</a>
          </div>
        </div>
      </div>
    </>
  );
}

function LinkList() {
  const { t } = useTranslation();

  return (
    <>
      <Link to="/">{t("layouts.home")}</Link> | <Link to="/projects">{t("layouts.projects")}</Link> |{" "}
      <Link to="/users">{t("layouts.users")}</Link>
    </>
  );
}
