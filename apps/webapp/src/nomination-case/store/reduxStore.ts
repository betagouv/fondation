import { configureStore, ThunkDispatch } from "@reduxjs/toolkit";
import { NominationCaseGateway } from "../core-logic/gateways/nominationCase.gateway";
import { nominationCaseRetrievalReducer as nominationCaseRetrieval } from "../core-logic/reducers/nominationCaseRetrieval.slice";
import { AppAction } from "./appActions";
import { AppState } from "./appState";

export interface Gateways {
  nominationCaseGateway: NominationCaseGateway;
}

export const initReduxStore = (gateways?: Partial<Gateways>) => {
  return configureStore({
    reducer: {
      nominationCaseRetrieval,
    },
    middleware: (getDefaultMiddleware) => {
      return getDefaultMiddleware({
        thunk: {
          extraArgument: gateways,
        },
        serializableCheck: false,
      });
    },
    devTools: true,
  });
};

export type ReduxStore = ReturnType<typeof initReduxStore> & {
  dispatch: ThunkDispatch<AppState, Gateways, AppAction>;
};
export type AppDispatch = ReduxStore["dispatch"];
