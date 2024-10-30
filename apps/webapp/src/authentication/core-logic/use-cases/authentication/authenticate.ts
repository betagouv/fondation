import { createAppAsyncThunk } from "../../../../nomination-file/store/createAppAsyncThunk";
import { AuthenticatedUser } from "../../gateways/authentication.gateway";

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
