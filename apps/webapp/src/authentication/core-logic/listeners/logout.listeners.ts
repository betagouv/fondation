import { Listener } from "../../../store/listeners";
import { logout } from "../use-cases/logout/logout";

export const storeDisconnectionOnLogout: Listener = (startAppListening) =>
  startAppListening({
    actionCreator: logout.fulfilled,
    effect: (
      _,
      {
        extra: {
          providers: { authenticationStorageProvider },
        },
      },
    ) => {
      authenticationStorageProvider?.storeDisconnection();
    },
  });
