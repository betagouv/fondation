import { createAction, createSlice } from "@reduxjs/toolkit";
import { AppState } from "../../../nomination-case/store/appState";
import { PartialAppDependencies } from "../../../nomination-case/store/reduxStore";
import { RouteToComponentFactory } from "../components/routeToComponent";
import { RouteChangedHandler } from "../components/routeChangedHandler";

export const createRouterSlice = ({
  routerProvider,
  routeToComponent,
  routeChangedHandler,
}: Pick<PartialAppDependencies["providers"], "routerProvider"> & {
  routeToComponent?: ReturnType<RouteToComponentFactory>;
  routeChangedHandler?: RouteChangedHandler;
}) =>
  createSlice({
    name: "router",
    initialState: (): AppState["router"] => ({
      hrefs: {
        login: routerProvider?.getLoginHref() ?? "login",
      },
      anchorsAttributes: {
        nominationCaseOverview:
          routerProvider?.getNominationCaseOverviewAnchorAttributes ??
          (() => ({
            href: "",
            onClick: () => {},
          })),
      },
      routeToComponent: routeToComponent ?? (() => () => null),
      routeChangedHandler: routeChangedHandler ?? (() => {}),
    }),
    reducers: {},
  });

export const routeChanged = createAction<string>("ROUTE_CHANGED");
