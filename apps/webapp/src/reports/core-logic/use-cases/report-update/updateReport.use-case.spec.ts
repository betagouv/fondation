import { NominationFile } from "shared-models";
import { ApiReportGateway } from "../../../adapters/secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../adapters/secondary/gateways/FakeReport.client";
import { AppState } from "../../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { ReportBuilder } from "../../builders/Report.builder";
import { ReportApiModelBuilder } from "../../builders/ReportApiModel.builder";
import { retrieveReport } from "../report-retrieval/retrieveReport.use-case";
import { updateReport, UpdateReportParams } from "./updateReport.use-case";
import {
  ExpectStoredReports,
  expectStoredReportsFactory,
} from "../../../../test/reports";

describe("Report Update", () => {
  let store: ReduxStore;
  let initialState: AppState<true>;
  let reportApiClient: FakeReportApiClient;
  let expectStoredReports: ExpectStoredReports;

  beforeEach(() => {
    reportApiClient = new FakeReportApiClient();
    reportApiClient.addReports(aReportApiModel);
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

  const testData: UpdateReportParams["data"][] = [
    {
      state: NominationFile.ReportState.READY_TO_SUPPORT,
    },
    {
      state: NominationFile.ReportState.SUPPORTED,
    },
    {
      comment: "new comment",
    },
    {
      state: NominationFile.ReportState.IN_PROGRESS,
      comment: "new comment",
    },
  ];
  it.each(testData)("updates with: %s", async (newData) => {
    reportApiClient.addReports(aReportApiModel);
    store.dispatch(retrieveReport.fulfilled(aReport, "", ""));

    await store.dispatch(
      updateReport({
        reportId: "report-id",
        data: newData,
      }),
    );

    expectStoredReports({
      ...aReport,
      ...newData,
    });
  });
});

const aReportApiModel = new ReportApiModelBuilder()
  .with("rules.management.TRANSFER_TIME.validated", false)
  .with("state", NominationFile.ReportState.NEW)
  .with("biography", "John Doe's biography")
  .with("comment", "Some comment")
  .build();
const aReport = new ReportBuilder().buildRetrieveSM();
