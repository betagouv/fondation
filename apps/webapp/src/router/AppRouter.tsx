import React, { lazy, PropsWithChildren, useEffect } from "react";
import { selectIsAuthenticated } from "../authentication/adapters/primary/presenters/selectIsAuthenticated";
import { Page } from "../layout/Page";
import { useAppSelector } from "../nomination-case/adapters/primary/hooks/react-redux";
import { routes, useRoute } from "./router";

const Login = lazy(
  () => import("../authentication/adapters/primary/components/Login")
);
const NominationCaseList = lazy(
  () =>
    import(
      "../nomination-case/adapters/primary/components/NominationCaseList/NominationCaseList"
    )
);
const NominationCaseOverview = lazy(
  () =>
    import(
      "../nomination-case/adapters/primary/components/NominationCaseOverview/NominationCaseOverview"
    )
);

export const AppRouter: React.FC<PropsWithChildren> = () => {
  const route = useRoute();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      routes.login().push();
    }
  }, [isAuthenticated]);

  const protectedPage = (element: JSX.Element) => {
    if (!isAuthenticated) {
      return null;
    }
    return (
      <React.Suspense fallback={<div>Loading</div>}> {element} </React.Suspense>
    );
  };

  return <Page>{routeToComponent(route, protectedPage)}</Page>;
};

const routeToComponent = (
  route: ReturnType<typeof useRoute>,
  protectedPage: (element: JSX.Element) => JSX.Element | null
): JSX.Element | null => {
  switch (route.name) {
    case false:
      return <section>Page non trouvée.</section>;
    case "login":
      return <Login />;
    case "nominationCaseList":
      return protectedPage(<NominationCaseList />);
    case "nominationCaseOverview":
      return protectedPage(<NominationCaseOverview id={route.params.id} />);

    default: {
      // Exhaustive check to ensure all cases are handled
      const _exhaustiveCheck: never = route;
      console.info(_exhaustiveCheck);
      throw new Error(`Unhandled route: ${JSON.stringify(route)}`);
    }
  }
};
