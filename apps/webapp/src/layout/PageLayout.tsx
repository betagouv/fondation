import { PropsWithChildren } from "react";
import { AppFooter } from "./AppFooter";
import { AppHeader } from "./AppHeader";

export const PageLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex h-screen flex-col">
      <AppHeader />
      <main className="flex flex-grow">
        <div className="flex-grow">{children}</div>
      </main>
      <AppFooter />
    </div>
  );
};
