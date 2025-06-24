import type { PropsWithChildren } from "react";
import { AppFooter } from "./AppFooter";
import { AppHeader } from "./AppHeader";
import { Notice } from "../shared/Notice";


export const PageLayout: React.FC<PropsWithChildren> = ({ children }) => {
  const isStaging =
    !import.meta.env.DEV && import.meta.env.VITE_DEPLOY_ENV === "staging";

  const notice = isStaging && (
    <Notice
      title="Environnement hors production."
      description="Les données affichées sont fictives."
    />
  );

  return (
    <div className="flex h-screen flex-col">
      <AppHeader />
      {notice}
      <main className="flex flex-grow">
        <div className="flex-grow">{children}</div>
      </main>
      <AppFooter />
    </div>
  );
};
