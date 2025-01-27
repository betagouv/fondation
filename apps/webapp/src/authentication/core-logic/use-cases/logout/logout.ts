import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";

export const logout = createAppAsyncThunk(
  "authentication/logout",
  async (
    _,
    {
      extra: {
        gateways: { authenticationGateway },
        providers: { logoutNotifierProvider },
      },
    },
  ) => {
    await authenticationGateway.logout();
    logoutNotifierProvider.notifyLogout();
  },
);
