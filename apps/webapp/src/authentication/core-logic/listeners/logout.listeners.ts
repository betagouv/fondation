import { Listener } from "../../../nomination-file/store/listeners";
import { logout } from "../use-cases/logout/logout";

export const storeDisconnectionAndRedirectOnLogout: Listener = (
  startAppListening,
) =>
  startAppListening({
    actionCreator: logout.fulfilled,
    effect: (
      _,
      {
        extra: {
          providers: { authenticationStorageProvider, routerProvider },
        },
      },
    ) => {
      authenticationStorageProvider?.storeDisconnection();
      routerProvider?.goToLogin();
    },
  });
