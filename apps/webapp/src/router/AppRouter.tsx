import React, { PropsWithChildren } from "react";
import { useAppSelector } from "../reports/adapters/primary/hooks/react-redux";
import { selectRouteChangedHandler } from "./adapters/selectors/selectRouteChangedHandler";
import { selectRouteToComponent } from "./adapters/selectors/selectRouteToComponent";
import { PageLayout } from "../layout/PageLayout";

export const AppRouter: React.FC<PropsWithChildren> = () => {
  const routeToComponent = useAppSelector(selectRouteToComponent);
  const useRouteChanged = useAppSelector(selectRouteChangedHandler);
  useRouteChanged();
  const component = routeToComponent();

  return <PageLayout>{component}</PageLayout>;
};
