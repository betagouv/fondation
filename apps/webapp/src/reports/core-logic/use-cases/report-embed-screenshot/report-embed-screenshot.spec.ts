import "@testing-library/jest-dom/vitest";
import { Editor } from "@tiptap/react";
import { File } from "node:buffer";
import { ReportFileUsage } from "shared-models";
import sharp, { FormatEnum } from "sharp";
import { DeterministicDateProvider } from "../../../../shared-kernel/adapters/secondary/providers/deterministicDateProvider";
import { StubNodeFileProvider } from "../../../../shared-kernel/adapters/secondary/providers/stubNodeFileProvider";
import { sleep } from "../../../../shared-kernel/core-logic/sleep";
import { AppState } from "../../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import {
  ExpectStoredReports,
  expectStoredReportsFactory,
} from "../../../../test/reports";
import { extensions } from "../../../adapters/primary/components/ReportOverview/TipTapEditor/extensions";
import { ApiReportGateway } from "../../../adapters/secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../adapters/secondary/gateways/FakeReport.client";
import { ReportBuilder } from "../../builders/Report.builder";
import { ReportApiModelBuilder } from "../../builders/ReportApiModel.builder";
import { retrieveReport } from "../report-retrieval/retrieveReport.use-case";
import { reportEmbedScreenshot } from "./report-embed-screenshot";
import { reportContentEmbeddedScreenshot } from "../../listeners/report-content-embedded-screenshot.listeners";

describe("Report Embed Screenshot", () => {
  let store: ReduxStore;
  let initialState: AppState<true>;
  let reportApiClient: FakeReportApiClient;
  let dateProvider: DeterministicDateProvider;
  let fileProvider: StubNodeFileProvider;
  let expectStoredReports: ExpectStoredReports;

  beforeEach(() => {
    reportApiClient = new FakeReportApiClient();
    reportApiClient.addReports(aReportApiModel);
    const reportGateway = new ApiReportGateway(reportApiClient);
    fileProvider = new StubNodeFileProvider();
    dateProvider = new DeterministicDateProvider();

    store = initReduxStore(
      {
        reportGateway,
      },
      { fileProvider, dateProvider },
      {},
      { reportContentEmbeddedScreenshot },
    );
    initialState = store.getState();

    expectStoredReports = expectStoredReportsFactory(store, initialState);

    store.dispatch(retrieveReport.fulfilled(aReport, "", ""));
  });

  it("generates a signed url when a screenshot is embedded with timestamp in filename", async () => {
    const fileBuffer = await givenAnImageBuffer("png");
    const file = new File([fileBuffer], "screenshot.png", {
      type: "image/png",
    });

    await embedScreenshot(file);
    await sleep(100); // wait for listener to resolve

    const signedUrl = `https://example.fr/screenshot.png-${dateProvider.timestamp}`;
    expectStoredReports({
      ...aReport,
      attachedFiles: [
        {
          usage: ReportFileUsage.EMBEDDED_SCREENSHOT,
          signedUrl,
          name: "screenshot.png-10",
        },
      ],
    });
  });

  it("uses updated timestamp for filename when dateProvider timestamp changes", async () => {
    dateProvider.timestamp = 20;

    const fileBuffer = await givenAnImageBuffer("png");
    const file = new File([fileBuffer], "screenshot.png", {
      type: "image/png",
    });

    await embedScreenshot(file);
    await sleep(100); // wait for listener to resolve

    const signedUrl = `https://example.fr/screenshot.png-${dateProvider.timestamp}`;
    expectStoredReports({
      ...aReport,
      attachedFiles: [
        {
          usage: ReportFileUsage.EMBEDDED_SCREENSHOT,
          signedUrl,
          name: "screenshot.png-20",
        },
      ],
    });
  });

  it("refuses to embed a .txt file", async () => {
    const file = new File(["test content"], "file.txt", {
      type: "text/plain",
    });
    await file.arrayBuffer();
    expectUploadError(await embedScreenshot(file), "Invalid mime type: ");
  });

  it.each`
    format
    ${"png"}
    ${"jpg"}
  `("embeds a $format image", async ({ format }) => {
    const fileBuffer = await givenAnImageBuffer(format);
    const file = new File([fileBuffer], `file.${format}`, {
      type: `image/${format}`,
    });
    await expect(embedScreenshot(file)).resolves.toBeDefined();
  });

  const embedScreenshot = (file: File) =>
    store.dispatch(
      reportEmbedScreenshot({
        reportId: aReport.id,
        // @ts-expect-error Problème d'appel à la méthode arrayBuffer avec le
        // File du navigateur non investigué
        file,
        editor: new Editor({
          extensions,
        }),
      }),
    );

  const givenAnImageBuffer = async (
    format: Extract<keyof FormatEnum, "png" | "jpg">,
  ) => {
    fileProvider.mimeType = `image/${format}`;
    const fileBuffer = await sharp({
      create: {
        width: 256,
        height: 256,
        channels: 3,
        background: { r: 128, g: 0, b: 0 },
      },
    })
      .toFormat(format)
      .toBuffer();

    return fileBuffer;
  };

  const expectUploadError = (
    resp: Awaited<ReturnType<typeof embedScreenshot>>,
    message: string,
  ) =>
    expect(resp).toMatchObject({
      error: expect.objectContaining({
        message,
      }),
    });
});

const aReportApiModel = new ReportApiModelBuilder().build();
const aReport = ReportBuilder.fromApiModel(aReportApiModel).buildRetrieveSM();
