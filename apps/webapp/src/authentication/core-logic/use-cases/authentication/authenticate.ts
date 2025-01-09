import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";
import { AuthenticatedUser } from "../../gateways/Authentication.gateway";

type AuthenticateParams = { email: string; password: string };

export const authenticate = createAppAsyncThunk<
  AuthenticatedUser,
  AuthenticateParams
>(
  "authentication/authenticate",
  async (
    { email, password },
    {
      extra: {
        gateways: { authenticationGateway },
      },
    },
  ) => {
    return authenticationGateway.authenticate(email, password);
  },
);
