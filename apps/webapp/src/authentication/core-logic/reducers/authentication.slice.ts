import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "../../../nomination-case/store/appState";
import { authenticate } from "../use-cases/authentication/authenticate";

const initialState: AppState["authentication"] = { authenticated: false };

const authenticationSlice = createSlice({
  name: "authentication",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(authenticate.fulfilled, (state, action) => {
      state.authenticated = action.payload;
    });
  },
});

export const authenticationReducer = authenticationSlice.reducer;
