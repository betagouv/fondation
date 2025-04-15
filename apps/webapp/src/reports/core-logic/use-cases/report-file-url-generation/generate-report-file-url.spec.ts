import { ApiReportGateway } from "../../../adapters/secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../adapters/secondary/gateways/FakeReport.client";
import { AppState } from "../../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import { ReportBuilder } from "../../builders/Report.builder";
import { ReportApiModelBuilder } from "../../builders/ReportApiModel.builder";
import { retrieveReport } from "../report-retrieval/retrieveReport.use-case";
import { generateReportFileUrl } from "./generate-report-file-url";
import {
  ExpectStoredReports,
  expectStoredReportsFactory,
} from "../../../../test/reports";
import { ReportFileUsage } from "shared-models";
import { FakeFileApiClient } from "../../../../files/adapters/secondary/gateways/FakeFile.client";
import { ApiFileGateway } from "../../../../files/adapters/secondary/gateways/ApiFile.gateway";

describe("Generate Report File Url", () => {
  let store: ReduxStore;
  let initialState: AppState<true>;
  let reportApiClient: FakeReportApiClient;
  let fileApiClient: FakeFileApiClient;
  let expectStoredReports: ExpectStoredReports;

  beforeEach(() => {
    reportApiClient = new FakeReportApiClient();
    const reportGateway = new ApiReportGateway(reportApiClient);
    fileApiClient = new FakeFileApiClient();
    const fileGateway = new ApiFileGateway(fileApiClient);

    store = initReduxStore(
      {
        reportGateway,
        fileGateway,
      },
      {},
      {},
    );
    initialState = store.getState();

    expectStoredReports = expectStoredReportsFactory(store, initialState);
  });

  it("generates a report file url", async () => {
    const expectedAttachedFiles = [
      {
        signedUrl,
        name: "file.png",
        fileId: "file-id",
      },
    ];
    fileApiClient.setFiles(...expectedAttachedFiles);

    const aReportApiModel = new ReportApiModelBuilder()
      .with("attachedFiles", [
        {
          usage: ReportFileUsage.ATTACHMENT,
          name: "file.png",
          fileId: "file-id",
          signedUrl: null,
        },
      ])
      .build();
    const aReport =
      ReportBuilder.fromApiModel(aReportApiModel).buildRetrieveSM();

    reportApiClient.addReports(aReportApiModel);
    store.dispatch(retrieveReport.fulfilled(aReport, "", ""));

    await store.dispatch(
      generateReportFileUrl({
        reportId: aReportApiModel.id,
        fileId: "file-id",
      }),
    );

    expectStoredReports({
      ...aReport,
      attachedFiles: expectedAttachedFiles,
    });
  });
});

const signedUrl = "https://example.fr/file.png";
