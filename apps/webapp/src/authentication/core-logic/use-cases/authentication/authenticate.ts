import { createAppAsyncThunk } from "../../../../nomination-file/store/createAppAsyncThunk";

type AuthenticateParams = { email: string; password: string };

export const authenticate = createAppAsyncThunk<
  { reporterName: string } | null,
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
