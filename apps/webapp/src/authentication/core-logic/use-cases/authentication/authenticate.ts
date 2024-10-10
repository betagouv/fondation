import { createAppAsyncThunk } from "../../../../nomination-file/store/createAppAsyncThunk";

type AuthenticateParams = { username: string; password: string };

export const authenticate = createAppAsyncThunk<boolean, AuthenticateParams>(
  "authentication/authenticate",
  async (
    { username, password },
    {
      extra: {
        gateways: { authenticationGateway },
      },
    },
  ) => {
    return authenticationGateway.authenticate(username, password);
  },
);
