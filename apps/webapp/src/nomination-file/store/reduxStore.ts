import { Action, configureStore, ThunkDispatch } from "@reduxjs/toolkit";
import { AuthenticationGateway } from "../../authentication/core-logic/gateways/authentication.gateway";
import { AuthenticationStorageProvider } from "../../authentication/core-logic/providers/authenticationStorage.provider";
import { createAuthenticationSlice } from "../../authentication/core-logic/reducers/authentication.slice";
import {
  RouteToComponentMap,
  routeToReactComponentMap,
} from "../../router/adapters/routeToReactComponentMap";
import { RouteChangedHandler } from "../../router/core-logic/components/routeChangedHandler";
import { RouteToComponentFactory } from "../../router/core-logic/components/routeToComponent";
import { RouterProvider } from "../../router/core-logic/providers/router";
import { createRouterSlice } from "../../router/core-logic/reducers/router.slice";
import { NominationFileGateway } from "../core-logic/gateways/NominationFile.gateway";
import { nominationCaseListReducer as nominationCaseList } from "../core-logic/reducers/nominationFileList.slice";
import { nominationCaseRetrievalReducer as nominationFileOverview } from "../core-logic/reducers/nominationFileOverview.slice";
import { AppState } from "./appState";
import { AppListeners } from "./listeners";
import { createAppListenerMiddleware } from "./middlewares/listener.middleware";

export interface Gateways {
  nominationFileGateway: NominationFileGateway;
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

export const initReduxStore = <IsTest extends boolean = true>(
  gateways: IsTest extends true ? Partial<Gateways> : Gateways,
  providers: IsTest extends true ? Partial<Providers> : Providers,
  nestedPrimaryAdapters: IsTest extends true
    ? Partial<NestedPrimaryAdapters>
    : NestedPrimaryAdapters,
  listeners?: IsTest extends true ? Partial<AppListeners> : AppListeners,
  routeToComponentMap: RouteToComponentMap = routeToReactComponentMap,
) => {
  return configureStore({
    reducer: {
      nominationFileOverview,
      nominationCaseList,
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
