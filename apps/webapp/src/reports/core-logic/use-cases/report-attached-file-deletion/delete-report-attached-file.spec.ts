import { ReportFileUsage } from "shared-models";
import { AppState } from "../../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import {
  ExpectStoredReports,
  expectStoredReportsFactory,
} from "../../../../test/reports";
import { ApiReportGateway } from "../../../adapters/secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../adapters/secondary/gateways/FakeReport.client";
import { ReportBuilder } from "../../builders/Report.builder";
import { ReportApiModelBuilder } from "../../builders/ReportApiModel.builder";
import { retrieveReport } from "../report-retrieval/retrieveReport.use-case";
import { deleteReportFile } from "./delete-report-attached-file";

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
  fileId: "file-id",
};
const aReportApiModel = new ReportApiModelBuilder()
  .with("attachedFiles", [aFile])
  .build();
const aReport = {
  ...ReportBuilder.fromApiModel(aReportApiModel).buildRetrieveSM(),
  attachedFiles: [aFile],
};
