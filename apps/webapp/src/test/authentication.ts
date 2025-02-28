import { AuthenticatedUserSM } from "../authentication/core-logic/gateways/Authentication.gateway";
import { AppState } from "../store/appState";
import { ReduxStore } from "../store/reduxStore";

export const expectUnauthenticatedStoreFactory =
  (store: ReduxStore, initialState: AppState<true>) => () =>
    expect(store.getState()).toEqual<AppState<true>>({
      ...initialState,
      authentication: {
        ...initialState.authentication,
        authenticated: false,
      },
    });

export const expectAuthenticatedUserFactory =
  (store: ReduxStore, initialState: AppState<true>) =>
  (user: AuthenticatedUserSM) =>
    expect(store.getState()).toEqual<AppState<true>>({
      ...initialState,
      authentication: {
        ...initialState.authentication,
        authenticateQueryStatus: "fulfilled",
        authenticated: true,
        user,
      },
    });

export type ExpectAuthenticatedUser = ReturnType<
  typeof expectAuthenticatedUserFactory
>;
