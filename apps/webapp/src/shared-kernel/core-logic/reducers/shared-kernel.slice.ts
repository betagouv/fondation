import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "../../../store/appState";

export const createSharedKernelSlice = (currentDate: Date) =>
  createSlice({
    name: "shared-kernel",
    initialState: (): AppState["sharedKernel"] => ({
      currentDate,
    }),
    reducers: {},
  });
