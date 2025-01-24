import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppState } from "../../../store/appState";
import { listReport } from "../use-cases/report-listing/listReport.use-case";
import { ReportListStateFilter } from "../../adapters/primary/labels/report-list-state-filter-labels.mapper";
import { logout } from "../../../authentication/core-logic/use-cases/logout/logout";

const initialState: AppState["reportList"] = { data: null, filters: {} };

const reportListSlice = createSlice({
  name: "reportList",
  initialState,
  reducers: {
    filteredByState: (state, action: PayloadAction<ReportListStateFilter>) => {
      if (action.payload === "all") state.filters.state = undefined;
      else state.filters.state = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(listReport.fulfilled, (state, action) => {
      if (action.payload) state.data = action.payload;
    });
    builder.addCase(logout.fulfilled, (state) => {
      state.data = null;
    });
  },
});

export const reportListReducer = reportListSlice.reducer;
export const { filteredByState: reportsFilteredByState } =
  reportListSlice.actions;
