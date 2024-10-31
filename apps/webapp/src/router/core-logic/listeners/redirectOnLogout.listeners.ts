import { logout } from "../../../authentication/core-logic/use-cases/logout/logout";
import { Listener } from "../../../nomination-file/store/listeners";

export const redirectOnLogout: Listener = (startAppListening) =>
  startAppListening({
    actionCreator: logout.fulfilled,
    effect: (
      _,
      {
        extra: {
          providers: { routerProvider },
        },
      },
    ) => {
      if (!routerProvider) throw new Error("routerProvider is not defined");
      routerProvider.goToLogin();
    },
  });
