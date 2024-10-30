import { Listener } from "../../../nomination-file/store/listeners";
import { authenticate } from "../use-cases/authentication/authenticate";

export const storeAuthenticationOnLoginSuccess: Listener = (
  startAppListening,
) =>
  startAppListening({
    actionCreator: authenticate.fulfilled,
    effect: (
      action,
      {
        extra: {
          providers: { authenticationStorageProvider },
        },
      },
    ) => {
      authenticationStorageProvider?.storeAuthentication(action.payload);
    },
  });
