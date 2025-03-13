import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "../../../store/appState";

export const createSharedKernelSlice = (
  currentDate: Date,
  currentTimestamp: number,
) => {
  return createSlice({
    name: "shared-kernel",
    initialState: (): AppState["sharedKernel"] => ({
      currentDate,
      currentTimestamp,
    }),
    reducers: {},
  });
};
