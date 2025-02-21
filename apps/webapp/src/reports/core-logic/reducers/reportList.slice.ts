import { createSlice } from "@reduxjs/toolkit";
import { logout } from "../../../authentication/core-logic/use-cases/logout/logout";
import { AppState } from "../../../store/appState";
import { listReport } from "../use-cases/report-listing/listReport.use-case";

export const createReportListSlice = () => {
  const initialState: AppState["reportList"] = {
    data: null,
    filters: {},
  };

  return createSlice({
    name: "reportList",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
      builder.addCase(listReport.fulfilled, (state, action) => {
        if (action.payload) state.data = action.payload;
      });
      builder.addCase(logout.fulfilled, (state) => {
        state.data = null;
      });
    },
  });
};
