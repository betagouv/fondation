import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "../../../store/appState";

export const createSharedKernelSlice = (currentDate: Date) => {
  return createSlice({
    name: "shared-kernel",
    initialState: (): AppState["sharedKernel"] => ({
      currentDate,
    }),
    reducers: {},
  });
};
