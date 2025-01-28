import { Listener } from "../../../store/listeners";
import { authenticationStateInitFromStore } from "../reducers/authentication.slice";

export const initializeAuthenticationState: Listener = (startAppListening) => {
  return startAppListening({
    predicate: (_, state) =>
      state.authentication.initializedFromPersistence === false,
    effect: async (
      _,
      {
        dispatch,
        extra: {
          gateways: { authenticationGateway },
        },
      },
    ) => {
      if (!authenticationGateway) return;

      try {
        const user = await authenticationGateway.validateSession();

        dispatch(
          authenticationStateInitFromStore({
            authenticated: !!user,
            user,
          }),
        );
      } catch {
        // We quietly ignore the error if the user doesn't have a valid cookie,
        // the user being unauthenticated in the state by default.
      }
    },
  });
};
