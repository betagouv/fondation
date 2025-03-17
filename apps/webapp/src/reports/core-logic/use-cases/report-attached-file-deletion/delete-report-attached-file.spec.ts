import { ApiReportGateway } from "../../../adapters/secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../adapters/secondary/gateways/FakeReport.client";
import { AppState } from "../../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import { ReportBuilder } from "../../builders/Report.builder";
import { ReportApiModelBuilder } from "../../builders/ReportApiModel.builder";
import { reportFileAttached } from "../../listeners/report-file-attached.listeners";
import { retrieveReport } from "../report-retrieval/retrieveReport.use-case";
import { deleteReportFile } from "./delete-report-attached-file";
import {
  ExpectStoredReports,
  expectStoredReportsFactory,
} from "../../../../test/reports";
import { ReportFileUsage, ReportRetrievalVM } from "shared-models";

describe("Delete Report Attached File", () => {
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
      { reportFileAttached },
    );
    initialState = store.getState();

    expectStoredReports = expectStoredReportsFactory(store, initialState);

    store.dispatch(retrieveReport.fulfilled(aReport, "", aReport.id));
  });

  it("deletes a report", async () => {
    await store.dispatch(
      deleteReportFile({
        reportId: aReport.id,
        fileName: "file.pdf",
      }),
    );

    expectStoredReports({
      ...aReport,
      attachedFiles: [],
    });
  });
});

const aFile = {
  usage: ReportFileUsage.ATTACHMENT,
  signedUrl: "https://example.fr",
  name: "file.pdf",
};
const aReportApiModel = new ReportApiModelBuilder()
  .with("attachedFiles", [aFile])
  .build();
const aReport: ReportRetrievalVM = {
  ...ReportBuilder.fromApiModel(aReportApiModel).buildRetrieveSM(),
  attachedFiles: [aFile],
};
