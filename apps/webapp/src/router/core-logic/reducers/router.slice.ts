import { createAction, createSlice } from "@reduxjs/toolkit";
import { AppState } from "../../../store/appState";
import { PartialAppDependencies } from "../../../store/reduxStore";
import { RouteChangedHandler } from "../components/routeChangedHandler";
import { RouteToComponentFactory } from "../components/routeToComponent";

const getStubAnchorAttributes = () => ({
  href: "",
  onClick: () => {},
});

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
        current: window.location.href,
        login: routerProvider?.getLoginHref() ?? "login",
      },
      anchorsAttributes: {
        login:
          routerProvider?.getLoginAnchorAttributes ?? getStubAnchorAttributes,
        transparencies:
          routerProvider?.getTransparenciesAnchorAttributes ??
          getStubAnchorAttributes,
        perTransparency:
          routerProvider?.getTransparencyReportsAnchorAttributes ??
          getStubAnchorAttributes,
        reportOverview:
          routerProvider?.getReportOverviewAnchorAttributes ??
          getStubAnchorAttributes,
      },
      routeToComponent: routeToComponent ?? (() => () => null),
      routeChangedHandler: routeChangedHandler ?? (() => {}),
    }),
    reducers: {},
    extraReducers: (builder) => {
      builder.addCase(routeChanged, (state, action) => {
        state.hrefs.current = action.payload;
      });
    },
  });

export const routeChanged = createAction<string>("ROUTE_CHANGED");
