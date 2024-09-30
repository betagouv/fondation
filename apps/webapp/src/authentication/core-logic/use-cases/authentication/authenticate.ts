import { createAppAsyncThunk } from "../../../../nomination-case/store/createAppAsyncThunk";

type AuthenticateParams = { username: string; password: string };

export const authenticate = createAppAsyncThunk<boolean, AuthenticateParams>(
  "authentication/authenticate",
  async ({ username, password }, { extra: { authenticationGateway } }) => {
    return authenticationGateway.authenticate(username, password);
  }
);
