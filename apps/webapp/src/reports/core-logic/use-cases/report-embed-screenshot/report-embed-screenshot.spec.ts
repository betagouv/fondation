import "@testing-library/jest-dom/vitest";
import { Editor } from "@tiptap/react";
import { File } from "node:buffer";
import sharp, { FormatEnum } from "sharp";
import { DeterministicDateProvider } from "../../../../shared-kernel/adapters/secondary/providers/deterministicDateProvider";
import { DeterministicUuidGenerator } from "../../../../shared-kernel/adapters/secondary/providers/deterministicUuidGenerator";
import { StubNodeFileProvider } from "../../../../shared-kernel/adapters/secondary/providers/stubNodeFileProvider";
import { InvalidMimeTypeError } from "../../../../shared-kernel/core-logic/errors/InvalidMimeType.error";
import { AppState, ReportSM } from "../../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
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
import { reportEmbedScreenshot } from "./report-embed-screenshot";

describe("Report Embed Screenshot", () => {
  let store: ReduxStore;
  let initialState: AppState<true>;
  let reportApiClient: FakeReportApiClient;
  let dateProvider: DeterministicDateProvider;
  let fileProvider: StubNodeFileProvider;
  let uuidGenerator: DeterministicUuidGenerator;
  let expectStoredReports: ExpectStoredReports;
  let editor: Editor;

  beforeEach(() => {
    reportApiClient = new FakeReportApiClient();
    reportApiClient.addReports(aReportApiModel);
    const reportGateway = new ApiReportGateway(reportApiClient);
    fileProvider = new StubNodeFileProvider();
    dateProvider = new DeterministicDateProvider();
    uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [fileId1, fileId2];

    store = initReduxStore(
      {
        reportGateway,
      },
      { fileProvider, dateProvider, uuidGenerator },
      {},
    );
    initialState = store.getState();

    expectStoredReports = expectStoredReportsFactory(store, initialState);

    store.dispatch(retrieveReport.fulfilled(aReport, "", ""));
    editor = new Editor({
      extensions: createExtensions(),
    });
  });

  it("refuses to embed a .txt file", async () => {
    const file = new File(["test content"], "file.txt", {
      type: "text/plain",
    });
    await file.arrayBuffer();
    expectUploadError(await embedScreenshot(file), file.name);
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

  it.each([
    {
      fileNames: ["screenshot.png"],
    },
    {
      fileNames: ["screenshot1.png", "screenshot2.png"],
    },
  ])("stores a screenshot with its signed URL", async ({ fileNames }) => {
    const fileBuffer = await givenAnImageBuffer("png");
    const files = fileNames.map(
      (fileName) =>
        new File([fileBuffer], fileName, {
          type: "image/png",
        }),
    );

    await embedScreenshot(...files);

    const expectedFiles = fileNames.map((fileName, index) => {
      const fileNameWithTimestamp = `${fileName}-${dateProvider.timestamp}`;
      return {
        fileId: index === 0 ? fileId1 : fileId2,
        name: fileNameWithTimestamp,
        signedUrl: `${FakeReportApiClient.BASE_URI}/${fileNameWithTimestamp}`,
      };
    });
    expectStoredScreenshots({
      files: expectedFiles,
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

  const embedScreenshot = (...files: File[]) =>
    store.dispatch(
      reportEmbedScreenshot({
        reportId: aReport.id,
        // @ts-expect-error Problème d'appel à la méthode arrayBuffer avec le
        // File du navigateur non investigué
        files,
        editor,
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
    fileName: string,
  ) =>
    expect(resp).toMatchObject({
      error: expect.objectContaining({
        message: new InvalidMimeTypeError({
          fileName: `${fileName}-${new DeterministicDateProvider().timestamp}`,
        }).message,
      }),
    });
});

const aReportApiModel = new ReportApiModelBuilder().build();
const aReport = ReportBuilder.fromApiModel(aReportApiModel).buildRetrieveSM();

const fileId1 = "file-id1";
const fileId2 = "file-id2";
