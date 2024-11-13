import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "../../store/appState";
import { listReport } from "../use-cases/report-listing/listReport.use-case";

const initialState: AppState["reportList"] = { data: null };

const reportListSlice = createSlice({
  name: "reportList",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(listReport.fulfilled, (state, action) => {
      if (action.payload) state.data = action.payload;
    });
  },
});

export const reportListReducer = reportListSlice.reducer;
