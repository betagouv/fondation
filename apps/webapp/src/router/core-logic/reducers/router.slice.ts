import { createAction, createSlice } from "@reduxjs/toolkit";
import { AppState } from "../../../nomination-file/store/appState";
import { PartialAppDependencies } from "../../../nomination-file/store/reduxStore";
import { RouteChangedHandler } from "../components/routeChangedHandler";
import { RouteToComponentFactory } from "../components/routeToComponent";

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
        nominationFileList:
          routerProvider?.getNominationFileListHref() ??
          "nomination-file-list-href",
      },
      anchorsAttributes: {
        nominationFileOverview:
          routerProvider?.getNominationFileOverviewAnchorAttributes ??
          (() => ({
            href: "",
            onClick: () => {},
          })),
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
