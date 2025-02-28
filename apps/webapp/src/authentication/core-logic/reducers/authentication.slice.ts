import { createAction, createSlice } from "@reduxjs/toolkit";
import { AppState } from "../../../store/appState";
import { authenticate } from "../use-cases/authentication/authenticate";
import { logout } from "../use-cases/logout/logout";

const initialState: AppState["authentication"] = {
  authenticated: false,
  user: null,
  initializedFromPersistence: false,
  authenticateQueryStatus: "idle",
};

export const createAuthenticationSlice = () =>
  createSlice({
    name: "authentication",
    initialState,
    reducers: {
      setAuthentication: (state, action) => {
        state.authenticated = action.payload.authenticated;
        state.user = action.payload.user;
      },
    },
    extraReducers: (builder) => {
      builder.addCase(authenticate.fulfilled, (state, action) => {
        state.authenticated = true;
        state.user = action.payload;
        state.authenticateQueryStatus = "fulfilled";
      });
      builder.addCase(authenticate.rejected, (state) => {
        state.authenticateQueryStatus = "rejected";
      });
      builder.addCase(logout.fulfilled, (state) => {
        state.authenticated = false;
        state.user = null;
      });
      builder.addCase(authenticationStateInitFromStore, (state, action) => {
        state.authenticated = action.payload.authenticated;
        state.user = action.payload.user;
        state.initializedFromPersistence = true;
      });
    },
  });

export const authenticationStateInitFromStore = createAction<
  Pick<AppState["authentication"], "authenticated" | "user">
>("AUTHENTICATION_STATE_INIT_FROM_STORE");
