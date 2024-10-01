import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "../../../nomination-case/store/appState";
import { authenticate } from "../use-cases/authentication/authenticate";
import { routes } from "../../../router/router";
import { AuthenticationStorageProvider } from "../providers/authenticationStorage.provider";

export const authenticationSlice = (
  authenticationStorageProvider?: AuthenticationStorageProvider
) =>
  createSlice({
    name: "authentication",
    initialState: (): AppState["authentication"] => ({
      authenticated: !!authenticationStorageProvider?.isAuthenticated(),
      forbiddenPageAsked: false,
    }),
    reducers: {},
    extraReducers: (builder) => {
      builder.addCase(authenticate.fulfilled, (state, action) => {
        state.authenticated = action.payload;
        routes.nominationCaseList().push();
      });
    },
  });
