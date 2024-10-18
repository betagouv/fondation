import { Action, configureStore, ThunkDispatch } from "@reduxjs/toolkit";
import { AuthenticationGateway } from "../../authentication/core-logic/gateways/authentication.gateway";
import { AuthenticationStorageProvider } from "../../authentication/core-logic/providers/authenticationStorage.provider";
import { createAuthenticationSlice } from "../../authentication/core-logic/reducers/authentication.slice";
import { RouterProvider } from "../../router/core-logic/providers/router";
import { NominationFileGateway } from "../core-logic/gateways/NominationFile.gateway";
import { nominationCaseListReducer as nominationCaseList } from "../core-logic/reducers/nominationFileList.slice";
import { nominationCaseRetrievalReducer as nominationFileOverview } from "../core-logic/reducers/nominationFileOverview.slice";
import { AppState } from "./appState";
import { Listener } from "./listeners";
import { createAppListenerMiddleware } from "./middlewares/listener.middleware";
import { createRouterSlice } from "../../router/core-logic/reducers/router.slice";
import { RouteToComponentFactory } from "../../router/core-logic/components/routeToComponent";
import {
  RouteToComponentMap,
  routeToReactComponentMap,
} from "../../router/adapters/routeToReactComponentMap";
import { RouteChangedHandler } from "../../router/core-logic/components/routeChangedHandler";

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
  nestedPrimaryAdapters: NestedPrimaryAdapters;
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
  listeners?: Listener[],
  routeToComponentMap: RouteToComponentMap = routeToReactComponentMap,
) => {
  return configureStore({
    reducer: {
      nominationFileOverview,
      nominationCaseList,
      authentication: createAuthenticationSlice({
        authenticationStorageProvider: providers?.authenticationStorageProvider,
        routerProvider: providers?.routerProvider,
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
        nestedPrimaryAdapters: nestedPrimaryAdapters ?? {},
      };

      return getDefaultMiddleware({
        thunk: {
          extraArgument: appDependencies,
        },
        serializableCheck: false,
      }).prepend(
        createAppListenerMiddleware(
          appDependencies as AppDependencies,
          listeners,
        ).middleware,
      );
    },
    devTools: true,
  });
};

type AppThunkDispatch = ThunkDispatch<AppState, AppDependencies, Action>;
export type ReduxStore = ReturnType<typeof initReduxStore> & {
  dispatch: AppThunkDispatch;
};
export type AppDispatch = AppThunkDispatch;
