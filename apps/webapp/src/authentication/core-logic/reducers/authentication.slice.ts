import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "../../../nomination-file/store/appState";
import { PartialAppDependencies } from "../../../nomination-file/store/reduxStore";
import { authenticate } from "../use-cases/authentication/authenticate";
import { routeChanged } from "../../../router/core-logic/reducers/router.slice";

export const createAuthenticationSlice = ({
  authenticationStorageProvider,
  routerProvider,
}: Pick<
  PartialAppDependencies["providers"],
  "authenticationStorageProvider" | "routerProvider"
>) =>
  createSlice({
    name: "authentication",
    initialState: (): AppState["authentication"] => ({
      authenticated: !!authenticationStorageProvider?.isAuthenticated(),
      forbiddenPageAsked: false,
    }),
    reducers: {},
    extraReducers: (builder) => {
      builder.addCase(routeChanged, (state) => {
        if (!state.authenticated) routerProvider?.goToLogin();
      });
      builder.addCase(authenticate.fulfilled, (state, action) => {
        state.authenticated = action.payload;
        routerProvider?.goToNominationFileList();
      });
    },
  });
