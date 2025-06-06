import { createAsyncThunk } from "@reduxjs/toolkit";
import { AppState } from "./appState";
import { AppDependencies, AppDispatch } from "./reduxStore";

export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: AppState;
  dispatch: AppDispatch;
  extra: AppDependencies;
}>();
