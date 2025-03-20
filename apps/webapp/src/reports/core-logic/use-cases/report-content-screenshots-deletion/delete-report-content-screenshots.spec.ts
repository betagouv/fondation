import { AttachedFileVM, ReportFileUsage } from "shared-models";
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
import { reportFileAttached } from "../../listeners/report-file-attached.listeners";
import { retrieveReport } from "../report-retrieval/retrieveReport.use-case";
import { deleteReportContentScreenshots } from "./delete-report-content-screenshots";
import { Mock } from "vitest";

describe("Delete Report Attached Files", () => {
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

  it("deletes two reports", async () => {
    await deleteReports();
    expectStoredReports({
      ...aReport,
      contentScreenshots: null,
    });
  });

  it("adds a screenshot to the editor if the deletion fails", async () => {
    reportApiClient.deleteFilesError = new Error();
    const addScreenshotToEditor = vi.fn();

    await deleteReports(addScreenshotToEditor);

    expectScreenshotAddedToEditor(addScreenshotToEditor, aFile);
    expectScreenshotAddedToEditor(addScreenshotToEditor, aSecondFile, {
      nth: 2,
    });
  });

  const deleteReports = async (addScreenshotToEditor = () => false) =>
    store.dispatch(
      deleteReportContentScreenshots({
        reportId: aReport.id,
        fileNames: [aFile.name, aSecondFile.name],
        addScreenshotToEditor,
      }),
    );

  const expectScreenshotAddedToEditor = (
    addScreenshotToEditor: Mock,
    file: AttachedFileVM,
    opts: { nth: number } = { nth: 1 },
  ) =>
    expect(addScreenshotToEditor).toHaveBeenNthCalledWith(opts.nth, {
      fileUrl: file.signedUrl,
      fileName: file.name,
    });
});

const aFile = {
  usage: ReportFileUsage.EMBEDDED_SCREENSHOT,
  signedUrl: "https://example.fr",
  name: "file.pdf",
};
const aSecondFile = {
  usage: ReportFileUsage.EMBEDDED_SCREENSHOT,
  signedUrl: "https://example.fr/file2.png",
  name: "file2.png",
};
const aReportApiModel = new ReportApiModelBuilder()
  .with("attachedFiles", [aFile, aSecondFile])
  .build();
const aReport: ReturnType<ReportBuilder["buildRetrieveSM"]> = {
  ...ReportBuilder.fromApiModel(aReportApiModel).buildRetrieveSM(),
  attachedFiles: [],
  contentScreenshots: {
    files: [aFile, aSecondFile],
    isUploading: false,
  },
};
