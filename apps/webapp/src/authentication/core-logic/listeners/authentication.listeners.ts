import { Listener } from "../../../store/listeners";
import { authenticationStateInitFromStore } from "../reducers/authentication.slice";
import { authenticate } from "../use-cases/authentication/authenticate";

export const storeAuthenticationOnLoginSuccess: Listener = (
  startAppListening,
) =>
  startAppListening({
    actionCreator: authenticate.fulfilled,
    effect: async (
      action,
      {
        extra: {
          providers: { authenticationStorageProvider },
        },
      },
    ) => {
      await authenticationStorageProvider?.storeAuthentication(action.payload);
    },
  });

export const initializeAuthenticationState: Listener = (startAppListening) =>
  startAppListening({
    predicate: (_, state) =>
      state.authentication.initializedFromStore === false,
    effect: async (
      _,
      {
        dispatch,
        extra: {
          providers: { authenticationStorageProvider },
        },
      },
    ) => {
      // There is no retry mechanism here, but it could be useful
      // because the IndexedDB instance access could take some time.
      const authenticated =
        await authenticationStorageProvider?.isAuthenticated();
      const user = await authenticationStorageProvider?.getUser();

      dispatch(
        authenticationStateInitFromStore({
          authenticated: !!authenticated,
          user: user || null,
        }),
      );
    },
  });
