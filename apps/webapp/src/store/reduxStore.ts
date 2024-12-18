import { Action, configureStore, ThunkDispatch } from "@reduxjs/toolkit";
import { AuthenticationGateway } from "../authentication/core-logic/gateways/authentication.gateway";
import { AuthenticationStorageProvider } from "../authentication/core-logic/providers/authenticationStorage.provider";
import { createAuthenticationSlice } from "../authentication/core-logic/reducers/authentication.slice";
import {
  RouteToComponentMap,
  routeToReactComponentMap,
} from "../router/adapters/routeToReactComponentMap";
import { RouteChangedHandler } from "../router/core-logic/components/routeChangedHandler";
import { RouteToComponentFactory } from "../router/core-logic/components/routeToComponent";
import { RouterProvider } from "../router/core-logic/providers/router";
import { createRouterSlice } from "../router/core-logic/reducers/router.slice";
import { ReportGateway } from "../reports/core-logic/gateways/Report.gateway";
import { reportListReducer as reportList } from "../reports/core-logic/reducers/reportList.slice";
import { createReportOverviewSlice } from "../reports/core-logic/reducers/reportOverview.slice";
import { AppState } from "./appState";
import { AppListeners } from "./listeners";
import { createAppListenerMiddleware } from "./middlewares/listener.middleware";
import { allRulesMap, AllRulesMap, NominationFile } from "shared-models";

export interface Gateways {
  reportGateway: ReportGateway;
  authenticationGateway: AuthenticationGateway;
}

export interface Providers {
  authenticationStorageProvider: AuthenticationStorageProvider;
  routerProvider: RouterProvider;
}

export interface NestedPrimaryAdapters {
  routeToComponentFactory: RouteToComponentFactory;
  routeChangedHandler: RouteChangedHandler;
}

export type AppDependencies = {
  gateways: Gateways;
  providers: Providers;
};

export type PartialAppDependencies = {
  [K in keyof AppDependencies]: Partial<AppDependencies[K]>;
};

const isProduction = process.env.NODE_ENV === "production";

export const initReduxStore = <IsTest extends boolean = true>(
  gateways: IsTest extends true ? Partial<Gateways> : Gateways,
  providers: IsTest extends true ? Partial<Providers> : Providers,
  nestedPrimaryAdapters: IsTest extends true
    ? Partial<NestedPrimaryAdapters>
    : NestedPrimaryAdapters,
  listeners?: IsTest extends true ? Partial<AppListeners> : AppListeners,
  routeToComponentMap: RouteToComponentMap = routeToReactComponentMap,
  rulesTuple: AllRulesMap = isProduction
    ? allRulesMap
    : {
        [NominationFile.RuleGroup.MANAGEMENT]: [],
        [NominationFile.RuleGroup.STATUTORY]: [],
        [NominationFile.RuleGroup.QUALITATIVE]: [],
      },
) => {
  return configureStore({
    reducer: {
      reportOverview: createReportOverviewSlice(rulesTuple).reducer,
      reportList,
      authentication: createAuthenticationSlice({
        authenticationStorageProvider: providers?.authenticationStorageProvider,
      }).reducer,
      router: createRouterSlice({
        routerProvider: providers.routerProvider,
        routeToComponent:
          nestedPrimaryAdapters.routeToComponentFactory?.(routeToComponentMap),
        routeChangedHandler: nestedPrimaryAdapters.routeChangedHandler,
      }).reducer,
    },
    middleware: (getDefaultMiddleware) => {
      const appDependencies: PartialAppDependencies = {
        gateways: gateways ?? {},
        providers: providers ?? {},
      };

      const middleware = getDefaultMiddleware({
        thunk: {
          extraArgument: appDependencies,
        },
        serializableCheck: false,
      });
      if (!listeners) {
        return middleware;
      }
      const middlewareWithListeners = middleware.prepend(
        createAppListenerMiddleware(appDependencies, Object.values(listeners))
          .middleware,
      );
      return middlewareWithListeners;
    },
    devTools: true,
  });
};

type AppThunkDispatch = ThunkDispatch<AppState, AppDependencies, Action>;
export type ReduxStore = ReturnType<typeof initReduxStore> & {
  dispatch: AppThunkDispatch;
};
export type AppDispatch = AppThunkDispatch;
