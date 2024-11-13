import { createAppAsyncThunk } from "../../../../reports/store/createAppAsyncThunk";

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
