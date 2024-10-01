import { PropsWithChildren } from "react";
import { AppHeader } from "./Header";

export const Page: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <AppHeader />
      {children}
    </>
  );
};
