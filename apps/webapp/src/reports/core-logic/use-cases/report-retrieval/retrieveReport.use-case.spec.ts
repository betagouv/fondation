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
import { FakeFileApiClient } from "../../../../files/adapters/secondary/gateways/FakeFile.client";
import { ApiFileGateway } from "../../../../files/adapters/secondary/gateways/ApiFile.gateway";
import { genFileUrlsOnReportRetrieval } from "../../listeners/genFileUrlsOnReportRetrieval.listeners";
import { sleep } from "../../../../shared-kernel/core-logic/sleep";

describe("Retrieve report", () => {
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
      { genFileUrlsOnReportRetrieval },
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

  it("generates signed urls for attached files", async () => {
    const aReportApiModelWithFiles = new ReportApiModelBuilder()
      .with("attachedFiles", [
        {
          name: "file1.png",
          usage: ReportFileUsage.ATTACHMENT,
          fileId: "file1-id",
        },
      ])
      .build();
    reportApiClient.addReports(aReportApiModelWithFiles);
    fileApiClient.setFiles({
      name: "file1.png",
      fileId: "file1-id",
      signedUrl: "https://example.fr/file1.png",
    });

    await store.dispatch(retrieveReport(aReportApiModelWithFiles.id));
    await sleep(20);

    expectStoredReports({
      ...ReportBuilder.fromApiModel(aReportApiModelWithFiles)
        .with("attachedFiles", [
          {
            name: "file1.png",
            fileId: "file1-id",
            signedUrl: "https://example.fr/file1.png",
          },
        ])
        .buildRetrieveSM(),
    });
  });

  it("adds the screenshot urls into the report content", async () => {
    const aReportApiModelWithScreenshots = new ReportApiModelBuilder()
      .with("comment", `<img data-file-name="screenshot1.png">`)
      .with("attachedFiles", [
        {
          name: "screenshot1.png",
          usage: ReportFileUsage.EMBEDDED_SCREENSHOT,
          fileId: "screenshot1-id",
        },
      ])
      .build();
    reportApiClient.addReports(aReportApiModelWithScreenshots);
    fileApiClient.setFiles({
      name: "screenshot1.png",
      signedUrl: "https://example.fr/screenshot1.png",
      fileId: "screenshot1-id",
    });

    await store.dispatch(retrieveReport(aReportApiModelWithScreenshots.id));

    expectStoredReports({
      ...ReportBuilder.fromApiModel(aReportApiModelWithScreenshots)
        .with("contentScreenshots", {
          files: [
            {
              name: "screenshot1.png",
              fileId: "screenshot1-id",
              signedUrl: null,
            },
          ],
        })
        .buildRetrieveSM(),
      comment: `<img data-file-name="screenshot1.png" src="https://example.fr/screenshot1.png">`,
    });
  });
});

const aReportApiModel = new ReportApiModelBuilder().build();
const aReport = ReportBuilder.fromApiModel(aReportApiModel).buildRetrieveSM();

const anotherReport = new ReportBuilder()
  .with("id", "another-report-id")
  .buildRetrieveSM();
