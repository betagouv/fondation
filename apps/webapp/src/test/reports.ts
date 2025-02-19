import { AppState, ReportSM } from "../store/appState";
import { ReduxStore } from "../store/reduxStore";

export const expectReportsFactory =
  (store: ReduxStore, initialState: AppState<true>) =>
  (...reports: ReportSM[]) =>
    expect(store.getState()).toEqual<AppState<true>>({
      ...initialState,
      reportOverview: {
        ...initialState.reportOverview,
        byIds: reports.reduce(
          (acc, report) => ({
            ...acc,
            [report.id]: report,
          }),
          {},
        ),
      },
    });

export type ExpectReports = ReturnType<typeof expectReportsFactory>;
