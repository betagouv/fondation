import { FakeReportApiClient } from "../reports/adapters/secondary/gateways/FakeReport.client";
import { ReportApiModel } from "../reports/core-logic/builders/ReportApiModel.builder";
import { AppState, ReportSM } from "../store/appState";
import { ReduxStore } from "../store/reduxStore";

export const expectStoredReportsListFactory =
  (store: ReduxStore, initialState: AppState<true>) =>
  (reports: AppState["reportList"]["data"]) =>
    expect(store.getState()).toEqual<AppState<true>>({
      ...initialState,
      reportList: {
        ...initialState.reportList,
        data: reports,
      },
    });

export const expectStoredReportsFactory =
  (store: ReduxStore, initialState: AppState<true>) =>
  (...reports: ReportSM[]) =>
    expect(store.getState()).toEqual<AppState<true>>({
      ...initialState,
      reportOverview: {
        ...initialState.reportOverview,
        queryStatus: reports.reduce(
          (acc, report) => ({
            ...acc,
            [report.id]: "fulfilled",
          }),
          {},
        ),
        byIds: reports.length
          ? reports.reduce(
              (acc, report) => ({
                ...acc,
                [report.id]: report,
              }),
              {},
            )
          : null,
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
