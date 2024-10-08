import React, { PropsWithChildren } from "react";
import { Page } from "../layout/Page";
import { useAppSelector } from "../nomination-file/adapters/primary/hooks/react-redux";
import { selectRouteChangedHandler } from "./adapters/selectors/selectRouteChangedHandler";
import { selectRouteToComponent } from "./adapters/selectors/selectRouteToComponent";

export const AppRouter: React.FC<PropsWithChildren> = () => {
  const routeToComponent = useAppSelector(selectRouteToComponent);
  const useRouteChanged = useAppSelector(selectRouteChangedHandler);
  useRouteChanged();
  const component = routeToComponent();

  return <Page>{component}</Page>;
};
