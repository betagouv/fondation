import { createAction, createSlice } from "@reduxjs/toolkit";
import { logout } from "../../../authentication/core-logic/use-cases/logout/logout";
import { AppState } from "../../../store/appState";
import { PartialAppDependencies } from "../../../store/reduxStore";
import { ReportListStateFilter } from "../../adapters/primary/labels/report-list-state-filter-labels.mapper";
import { listReport } from "../use-cases/report-listing/listReport.use-case";

export const createReportListSlice = ({
  routerProvider,
}: Pick<PartialAppDependencies["providers"], "routerProvider">) => {
  const initialState: AppState["reportList"] = {
    data: null,
    filters: {},
    anchorsAttributes: {
      perTransparency:
        routerProvider?.getTransparencyReportsAnchorAttributes ??
        (() => ({
          href: "",
          onClick: () => {},
        })),
    },
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
      builder.addCase(reportsFilteredByState, (state, action) => {
        if (action.payload === "all") state.filters.state = undefined;
        else state.filters.state = action.payload;
      });
    },
  });
};

export const reportsFilteredByState = createAction<ReportListStateFilter>(
  "reportList/filteredByState",
);
