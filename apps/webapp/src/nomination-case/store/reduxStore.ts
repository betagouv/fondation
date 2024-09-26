import { Action, configureStore, ThunkDispatch } from "@reduxjs/toolkit";
import { NominationCaseGateway } from "../core-logic/gateways/nominationCase.gateway";
import { nominationCaseRetrievalReducer as nominationCaseOverview } from "../core-logic/reducers/nominationCaseOverview.slice";
import { AppState } from "./appState";

export interface Gateways {
  nominationCaseGateway: NominationCaseGateway;
}

export const initReduxStore = (gateways?: Partial<Gateways>) => {
  return configureStore({
    reducer: {
      nominationCaseRetrieval: nominationCaseOverview,
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
  dispatch: ThunkDispatch<AppState, Gateways, Action>;
};
export type AppDispatch = ReduxStore["dispatch"];
