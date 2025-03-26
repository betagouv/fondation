import { Editor } from "@tiptap/react";
import { ReportFileUsage } from "shared-models";
import { AppState } from "../../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import {
  ExpectStoredReports,
  expectStoredReportsFactory,
} from "../../../../test/reports";
import { createExtensions } from "../../../adapters/primary/components/ReportOverview/TipTapEditor/extensions";
import { ApiReportGateway } from "../../../adapters/secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../adapters/secondary/gateways/FakeReport.client";
import { ReportBuilder } from "../../builders/Report.builder";
import { ReportApiModelBuilder } from "../../builders/ReportApiModel.builder";
import { retrieveReport } from "../report-retrieval/retrieveReport.use-case";
import { deleteReportContentScreenshots } from "./delete-report-content-screenshots";

describe("Delete Report Attached Files", () => {
  let store: ReduxStore;
  let initialState: AppState<true>;
  let reportApiClient: FakeReportApiClient;
  let expectStoredReports: ExpectStoredReports;
  let editor: Editor;

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
    editor = new Editor({
      extensions: createExtensions({
        history: { newGroupDelay: 1 },
      }),
    });
  });

  it("deletes two reports", async () => {
    await deleteReports();
    expectStoredReports({
      ...aReport,
      contentScreenshots: null,
    });
  });

  it("still shows a screenshot in the editor if its deletion failed", async () => {
    reportApiClient.deleteFilesError = new Error();
    editor.chain().setImage({ src: aFile.signedUrl }).run();
    const editorStateWithImage = editor.getJSON();
    editor.chain().clearContent().run();

    await deleteReports();

    expect(editor.getJSON()).toEqual(editorStateWithImage);
  });

  const deleteReports = async () =>
    store.dispatch(
      deleteReportContentScreenshots({
        reportId: aReport.id,
        fileNames: [aFile.name, aSecondFile.name],
        editor,
      }),
    );
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
  },
};
