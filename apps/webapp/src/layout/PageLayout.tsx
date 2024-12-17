import { PropsWithChildren } from "react";
import { AppFooter } from "./AppFooter";
import { AppHeader } from "./AppHeader";

export const PageLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <main className="flex-grow flex">
        <div className="flex-grow">{children}</div>
      </main>
      <AppFooter />
    </div>
  );
};
