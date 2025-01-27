import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";
import { AuthenticatedUserSM } from "../../gateways/Authentication.gateway";

export type AuthenticateParams = { email: string; password: string };

export const authenticate = createAppAsyncThunk<
  AuthenticatedUserSM,
  AuthenticateParams
>(
  "authentication/authenticate",
  async (
    { email, password },
    {
      extra: {
        gateways: { authenticationGateway },
        providers: { loginNotifierProvider },
      },
    },
  ) => {
    const user = await authenticationGateway.authenticate(email, password);
    loginNotifierProvider.notifyLogin();
    return user;
  },
);
