import { createAsyncThunk } from "@reduxjs/toolkit";
import { AppState } from "./appState";
import { AppDispatch, Gateways } from "./reduxStore";

export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: AppState;
  dispatch: AppDispatch;
  extra: Gateways;
}>();
