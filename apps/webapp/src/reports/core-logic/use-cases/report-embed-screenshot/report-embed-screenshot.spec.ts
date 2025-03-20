import "@testing-library/jest-dom/vitest";
import { Editor } from "@tiptap/react";
import { File } from "node:buffer";
import sharp, { FormatEnum } from "sharp";
import { DeterministicDateProvider } from "../../../../shared-kernel/adapters/secondary/providers/deterministicDateProvider";
import { StubNodeFileProvider } from "../../../../shared-kernel/adapters/secondary/providers/stubNodeFileProvider";
import { AppState, ReportSM } from "../../../../store/appState";
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
    );
    initialState = store.getState();

    expectStoredReports = expectStoredReportsFactory(store, initialState);

    store.dispatch(retrieveReport.fulfilled(aReport, "", ""));
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
  `("allows a $format image", async ({ format }) => {
    const fileBuffer = await givenAnImageBuffer(format);
    const file = new File([fileBuffer], `file.${format}`, {
      type: `image/${format}`,
    });
    await expect(embedScreenshot(file)).resolves.toBeDefined();
  });

  it("stores a screenshot with its signed URL", async () => {
    const fileBuffer = await givenAnImageBuffer("png");
    const file = new File([fileBuffer], "screenshot.png", {
      type: "image/png",
    });

    await embedScreenshot(file);

    const expectedFileName = `screenshot.png-${dateProvider.timestamp}`;
    const signedUrl = `https://example.fr/${expectedFileName}`;

    expectStoredScreenshots({
      files: [
        {
          name: expectedFileName,
          signedUrl,
        },
      ],
      isUploading: false,
    });
  });

  it("says that a screenshot is uploading", async () => {
    const file = new File([""], "screenshot.png");

    givenAScreenshotUploadingState({
      reportId: aReport.id,
      file,
    });

    expectStoredScreenshots({
      files: [],
      isUploading: true,
    });
  });

  it("when uploading fails, it says that a screenshot is not uploading anymore", async () => {
    const file = new File([""], "screenshot.png");

    givenAStoredScreenshot({
      file,
      reportId: aReport.id,
      signedUrl: "https://example.fr/screenshot.png",
    });
    givenAScreenshotUploadRejected({
      file,
      reportId: aReport.id,
    });

    expectStoredScreenshots({
      files: [
        {
          name: "screenshot.png",
          signedUrl: "https://example.fr/screenshot.png",
        },
      ],
      isUploading: false,
    });
  });

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

  const givenAStoredScreenshot = ({
    file,
    reportId,
    signedUrl,
  }: {
    file: File;
    reportId: string;
    signedUrl: string;
  }) => {
    store.dispatch(
      reportEmbedScreenshot.fulfilled(
        {
          // @ts-expect-error Problème d'appel à la méthode arrayBuffer avec le
          // File du navigateur non investigué
          file,
          signedUrl,
        },
        "",
        {
          reportId,
          file,
          editor: new Editor({
            extensions,
          }),
        },
      ),
    );
  };

  const givenAScreenshotUploadingState = ({
    file,
    reportId,
  }: {
    file: File;
    reportId: string;
  }) => {
    store.dispatch(
      reportEmbedScreenshot.pending("", {
        reportId,
        // @ts-expect-error Problème d'appel à la méthode arrayBuffer avec le
        // File du navigateur non investigué
        file,
        editor: new Editor({
          extensions,
        }),
      }),
    );
  };

  const givenAScreenshotUploadRejected = ({
    file,
    reportId,
  }: {
    file: File;
    reportId: string;
  }) => {
    store.dispatch(
      reportEmbedScreenshot.rejected(new Error(), "", {
        reportId,
        // @ts-expect-error Problème d'appel à la méthode arrayBuffer avec le
        // File du navigateur non investigué
        file,
        editor: new Editor({
          extensions,
        }),
      }),
    );
  };

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

  const expectStoredScreenshots = (
    contentScreenshots: ReportSM["contentScreenshots"],
  ) =>
    expectStoredReports({
      ...aReport,
      contentScreenshots,
    });

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
