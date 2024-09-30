import { PropsWithChildren } from "react";
import { Login } from "../authentication/adapters/primary/components/Login";
import { selectIsAuthenticated } from "../authentication/adapters/primary/presenters/selectIsAuthenticated";
import { NominationCaseList } from "../nomination-case/adapters/primary/components/NominationCaseList/NominationCaseList";
import { NominationCaseOverview } from "../nomination-case/adapters/primary/components/NominationCaseOverview/NominationCaseOverview";
import { useAppSelector } from "../nomination-case/adapters/primary/hooks/react-redux";
import { useRoute } from "./router";

export const AppRouter: React.FC<PropsWithChildren> = ({ children }) => {
  const route = useRoute();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (!isAuthenticated) return <Login />;
  switch (route.name) {
    case "home":
    case "nominationCaseList":
      return <NominationCaseList />;
    case "nominationCaseOverview":
      return <NominationCaseOverview id={route.params.id} />;
  }

  return children;
};
