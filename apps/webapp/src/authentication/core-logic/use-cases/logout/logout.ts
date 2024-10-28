import { createAppAsyncThunk } from "../../../../nomination-file/store/createAppAsyncThunk";

export const logout = createAppAsyncThunk(
  "authentication/logout",
  async (
    _,
    {
      extra: {
        gateways: { authenticationGateway },
      },
    },
  ) => {
    return authenticationGateway.logout();
  },
);
