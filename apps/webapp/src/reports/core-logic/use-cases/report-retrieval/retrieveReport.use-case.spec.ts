import { ApiReportGateway } from "../../../adapters/secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../adapters/secondary/gateways/FakeReport.client";
import { AppState } from "../../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { ReportBuilder } from "../../builders/Report.builder";
import { ReportApiModelBuilder } from "../../builders/ReportApiModel.builder";
import { retrieveReport } from "./retrieveReport.use-case";
import {
  ExpectStoredReports,
  expectStoredReportsFactory,
} from "../../../../test/reports";

describe("Retrieve report", () => {
  let store: ReduxStore;
  let initialState: AppState<true>;
  let reportApiClient: FakeReportApiClient;
  let expectStoredReports: ExpectStoredReports;

  beforeEach(() => {
    reportApiClient = new FakeReportApiClient();
    const reportGateway = new ApiReportGateway(reportApiClient);
    store = initReduxStore(
      {
        reportGateway: reportGateway,
      },
      {},
      {},
    );
    initialState = store.getState();

    expectStoredReports = expectStoredReportsFactory(store, initialState);
  });

  it("retrieve a report", async () => {
    reportApiClient.addReports(aReportApiModel);
    await store.dispatch(retrieveReport("report-id"));
    expectStoredReports(aReport);
  });

  it("has two reports in the store after retrieving a second one", async () => {
    reportApiClient.addReports(aReportApiModel);
    store.dispatch(retrieveReport.fulfilled(anotherReport, "", ""));

    await store.dispatch(retrieveReport("report-id"));

    expectStoredReports(aReport, anotherReport);
  });
});

const aReportApiModel = new ReportApiModelBuilder().build();
const aReport = ReportBuilder.fromApiModel(aReportApiModel).buildRetrieveSM();

const anotherReport = new ReportBuilder()
  .with("id", "another-report-id")
  .buildRetrieveSM();
