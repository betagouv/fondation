import { Listener } from "../../../store/listeners";
import { sleep } from "../../../shared-kernel/core-logic/sleep";
import { AuthenticationStorageProvider } from "../providers/authenticationStorage.provider";
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

export const initializeAuthenticationState: Listener = (startAppListening) => {
  let tries = 0;
  const trialLimit = 10;

  const waitForStorageProvider = async (
    authenticationStorageProvider: AuthenticationStorageProvider,
  ) => {
    if (authenticationStorageProvider.isReady()) return;
    if (tries > trialLimit) {
      console.warn("Readiness trial limit reached for storage provider");
      return;
    }

    await sleep(200);
    tries++;

    await waitForStorageProvider(authenticationStorageProvider);
  };

  return startAppListening({
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
      if (!authenticationStorageProvider) return;
      await waitForStorageProvider(authenticationStorageProvider);

      const authenticated =
        await authenticationStorageProvider.isAuthenticated();
      const user = await authenticationStorageProvider.getUser();

      dispatch(
        authenticationStateInitFromStore({
          authenticated: !!authenticated,
          user: user || null,
        }),
      );
    },
  });
};
