import { authenticate } from "../../../authentication/core-logic/use-cases/authentication/authenticate";
import { Listener } from "../../../store/listeners";

export const redirectOnLogin: Listener = (startAppListening) =>
  startAppListening({
    actionCreator: authenticate.fulfilled,
    effect: (
      _,
      {
        extra: {
          providers: { routerProvider },
        },
      },
    ) => {
      if (!routerProvider) throw new Error("routerProvider is not defined");
      routerProvider.goToTransparencies();
    },
  });
