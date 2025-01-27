import { AppState } from "../store/appState";
import { ReduxStore } from "../store/reduxStore";

export const expectUnauthenticatedStoreFactory =
  (store: ReduxStore, initialState: AppState) => () => {
    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      authentication: {
        ...initialState.authentication,
        authenticated: false,
      },
    });
  };
