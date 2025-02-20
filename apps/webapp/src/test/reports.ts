import { FakeReportApiClient } from "../reports/adapters/secondary/gateways/FakeReport.client";
import { ReportApiModel } from "../reports/core-logic/builders/ReportApiModel.builder";
import { AppState, ReportSM } from "../store/appState";
import { ReduxStore } from "../store/reduxStore";

export const expectStoredReportsFactory =
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

export type ExpectStoredReports = ReturnType<typeof expectStoredReportsFactory>;

export const expectGatewayReportsFactory =
  (gateway: FakeReportApiClient) =>
  (...reports: ReportApiModel[]) => {
    expect(Object.values(gateway.reports)).toEqual(reports);
  };

export type ExpectGatewayReports = ReturnType<
  typeof expectGatewayReportsFactory
>;
