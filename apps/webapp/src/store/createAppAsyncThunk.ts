import { createAsyncThunk } from "@reduxjs/toolkit";
import { AppState } from "./appState";
import { AppDependencies, AppDispatch } from "./reduxStore";

export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: AppState;
  dispatch: AppDispatch;
  extra: AppDependencies;
}>();

export const createAppAsyncThunkFactory = <
  AppStateTransparencies extends string[],
>() =>
  createAsyncThunk.withTypes<{
    state: AppState<boolean, AppStateTransparencies>;
    dispatch: AppDispatch;
    extra: AppDependencies<AppStateTransparencies>;
  }>();
