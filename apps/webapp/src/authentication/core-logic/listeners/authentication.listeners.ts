import { Listener } from "../../../nomination-case/store/listeners";
import { authenticate } from "../use-cases/authentication/authenticate";

export const storeAuthenticationOnLoginSuccess: Listener = (
  startAppListening
) =>
  startAppListening({
    actionCreator: authenticate.fulfilled,
    effect: (
      action,
      {
        extra: {
          providers: { authenticationStorageProvider },
        },
      }
    ) => {
      if (action.payload)
        authenticationStorageProvider?.storeAuthentication(action.payload);
    },
  });
