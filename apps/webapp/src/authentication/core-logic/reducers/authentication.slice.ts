import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "../../../reports/store/appState";
import { PartialAppDependencies } from "../../../reports/store/reduxStore";
import { authenticate } from "../use-cases/authentication/authenticate";
import { logout } from "../use-cases/logout/logout";

export const createAuthenticationSlice = ({
  authenticationStorageProvider,
}: Pick<
  PartialAppDependencies["providers"],
  "authenticationStorageProvider"
>) =>
  createSlice({
    name: "authentication",
    initialState: (): AppState["authentication"] => ({
      authenticated: !!authenticationStorageProvider?.isAuthenticated(),
      user: authenticationStorageProvider?.getUser() || null,
    }),
    reducers: {},
    extraReducers: (builder) => {
      builder.addCase(authenticate.fulfilled, (state, action) => {
        state.authenticated = true;
        state.user = action.payload;
      });
      builder.addCase(logout.fulfilled, (state) => {
        state.authenticated = false;
        state.user = null;
      });
    },
  });
