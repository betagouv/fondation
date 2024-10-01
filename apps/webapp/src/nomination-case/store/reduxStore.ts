import { Action, configureStore, ThunkDispatch } from "@reduxjs/toolkit";
import { AuthenticationGateway } from "../../authentication/core-logic/gateways/authentication.gateway";
import { AuthenticationStorageProvider } from "../../authentication/core-logic/providers/authenticationStorage.provider";
import { authenticationSlice } from "../../authentication/core-logic/reducers/authentication.slice";
import { NominationCaseGateway } from "../core-logic/gateways/nominationCase.gateway";
import { nominationCaseListReducer as nominationCaseList } from "../core-logic/reducers/nominationCaseList.slice";
import { nominationCaseRetrievalReducer as nominationCaseOverview } from "../core-logic/reducers/nominationCaseOverview.slice";
import { AppState } from "./appState";
import { Listener } from "./listeners";
import { createAppListenerMiddleware } from "./middlewares/listener.middleware";

export interface Gateways {
  nominationCaseGateway: NominationCaseGateway;
  authenticationGateway: AuthenticationGateway;
}

export interface Providers {
  authenticationStorageProvider: AuthenticationStorageProvider;
}

export type AppDependencies = {
  gateways: Gateways;
  providers: Providers;
};

export type PartialAppDependencies = {
  [K in keyof AppDependencies]: Partial<AppDependencies[K]>;
};

export const initReduxStore = (
  gateways?: Partial<Gateways>,
  providers?: Partial<Providers>,
  listeners?: Listener[]
) => {
  return configureStore({
    reducer: {
      nominationCaseOverview,
      nominationCaseList,
      authentication: authenticationSlice(
        providers?.authenticationStorageProvider
      ).reducer,
    },
    middleware: (getDefaultMiddleware) => {
      const appDependencies: PartialAppDependencies = {
        gateways: gateways ?? {},
        providers: providers ?? {},
      };

      return getDefaultMiddleware({
        thunk: {
          extraArgument: appDependencies,
        },
        serializableCheck: false,
      }).prepend(
        createAppListenerMiddleware(
          appDependencies as AppDependencies,
          listeners
        ).middleware
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
