import { Editor } from "@tiptap/react";
import { ReportFileUsage } from "shared-models";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { extensions } from "../../../adapters/primary/components/ReportOverview/TipTapEditor/extensions";
import { ApiReportGateway } from "../../../adapters/secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../adapters/secondary/gateways/FakeReport.client";
import { ReportBuilder } from "../../builders/Report.builder";
import { retrieveReport } from "../report-retrieval/retrieveReport.use-case";
import { addScreenshotToEditor } from "./add-screenshot-to-editor";

describe("Add Screenshot To Editor", () => {
  let store: ReduxStore;
  let reportApiClient: FakeReportApiClient;
  let editor: Editor;

  beforeEach(() => {
    reportApiClient = new FakeReportApiClient();
    const reportGateway = new ApiReportGateway(reportApiClient);
    editor = new Editor({
      extensions,
    });

    store = initReduxStore(
      {
        reportGateway,
      },
      {},
      {},
    );
  });

  it("updates the report content with the file URL", async () => {
    const aScreenshot = {
      usage: ReportFileUsage.EMBEDDED_SCREENSHOT,
      name: "screenshot.png",
      signedUrl: "https://example.fr/file.png",
    };
    const aReport = new ReportBuilder()
      .with("attachedFiles", [aScreenshot])
      .buildRetrieveSM();
    store.dispatch(retrieveReport.fulfilled(aReport, "", ""));

    await store.dispatch(
      addScreenshotToEditor({
        reportId: aReport.id,
        fileName: "screenshot.png",
        fileUrl: "https://example.fr/file.png",
        editor,
      }),
    );

    expect(editor.getHTML()).toEqual(
      `<img width="100%" src="https://example.fr/file.png" data-file-name="screenshot.png">`,
    );
  });
});
