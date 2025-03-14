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
import { ReportFileUsage } from "shared-models";

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
        reportGateway,
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

  it.only("adds the screenshot urls into the report content", async () => {
    const aReportApiModelWithScreenshots = new ReportApiModelBuilder()
      .with("comment", `<img data-file-name="screenshot1.png">`)
      .with("attachedFiles", [
        {
          name: "screenshot1.png",
          usage: ReportFileUsage.EMBEDDED_SCREENSHOT,
          signedUrl: "https://screenshot1.png",
        },
      ])
      .build();
    reportApiClient.addReports(aReportApiModelWithScreenshots);

    await store.dispatch(retrieveReport(aReportApiModelWithScreenshots.id));

    expectStoredReports({
      ...ReportBuilder.fromApiModel(
        aReportApiModelWithScreenshots,
      ).buildRetrieveSM(),
      comment: `<img data-file-name="screenshot1.png" src="https://screenshot1.png">`,
    });
  });
});

const aReportApiModel = new ReportApiModelBuilder().build();
const aReport = ReportBuilder.fromApiModel(aReportApiModel).buildRetrieveSM();

const anotherReport = new ReportBuilder()
  .with("id", "another-report-id")
  .buildRetrieveSM();
