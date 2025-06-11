import { Role } from "shared-models";
import { authenticate } from "../../../authentication/core-logic/use-cases/authentication/authenticate";
import { Listener } from "../../../store/listeners";

export const redirectOnLogin: Listener = (startAppListening) =>
  startAppListening({
    actionCreator: authenticate.fulfilled,
    effect: (
      _,
      {
        getState,
        extra: {
          providers: { routerProvider },
        },
      },
    ) => {
      if (!routerProvider) throw new Error("routerProvider is not defined");

      const user = getState().authentication.user;
      if (!user) throw new Error("User is not defined");

      if (user.role === Role.ADJOINT_SECRETAIRE_GENERAL)
        routerProvider.onGoToSecretariatGeneralClick();
      else routerProvider.goToTransparencies();
    },
  });
