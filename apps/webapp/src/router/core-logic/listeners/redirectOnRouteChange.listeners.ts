import { AuthenticationStorageProvider } from "../../../authentication/core-logic/providers/authenticationStorage.provider";
import { authenticationStateInitFromStore } from "../../../authentication/core-logic/reducers/authentication.slice";
import { sleep } from "../../../shared-kernel/core-logic/sleep";
import { AppState } from "../../../store/appState";
import { Listener } from "../../../store/listeners";
import { routeChanged } from "../reducers/router.slice";

export const redirectOnRouteChange: Listener = (startAppListening) => {
  let tries = 0;
  const trialLimit = 10;

  return startAppListening({
    predicate: (action) =>
      action.type === routeChanged.type ||
      action.type === authenticationStateInitFromStore.type,
    effect: async (
      action,
      {
        getState,
        extra: {
          providers: { routerProvider, authenticationStorageProvider },
        },
      },
    ) => {
      if (!routerProvider) throw new Error("routerProvider is not defined");
      const state = getState();

      // We use the stored authentication state because it could
      // have changed in another tab or window.
      const authenticated = await getAuthenticated(
        state,
        authenticationStorageProvider,
      );

      const { current: currentHref } = state.router.hrefs;

      if (action.type === authenticationStateInitFromStore.type) {
        const userOnLoginPage = currentHref === routerProvider.getLoginHref();
        if (authenticated && userOnLoginPage) routerProvider.goToReportList();
        return;
      }

      if (action.type === routeChanged.type) {
        switch (action.payload) {
          case "/":
            if (authenticated) routerProvider.goToReportList();
            else routerProvider.goToLogin();
            break;
          case routerProvider.getLoginHref():
            if (authenticated) routerProvider.goToReportList();
            break;
          default:
            if (!authenticated) routerProvider.goToLogin();
        }
        return;
      }

      async function getAuthenticated(
        state: AppState,
        authenticationStorageProvider?: AuthenticationStorageProvider,
      ): Promise<boolean> {
        if (!authenticationStorageProvider)
          return state.authentication.authenticated;

        try {
          await waitForStorageProvider(authenticationStorageProvider);
          return await authenticationStorageProvider.isAuthenticated();
        } catch (error) {
          console.error(
            "Error while getting authenticated state from storage provider, returning it from the state",
            error,
          );
          return state.authentication.authenticated;
        }
      }

      async function waitForStorageProvider(
        authenticationStorageProvider: AuthenticationStorageProvider,
      ) {
        if (authenticationStorageProvider.isReady()) return;
        if (tries > trialLimit) {
          console.warn("Readiness trial limit reached for storage provider");
          return;
        }

        await sleep(200);
        tries++;

        await waitForStorageProvider(authenticationStorageProvider);
      }
    },
  });
};
