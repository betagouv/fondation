import "@testing-library/jest-dom/vitest";
import { File } from "node:buffer";
import sharp, { FormatEnum } from "sharp";
import { ApiFileGateway } from "../../../../files/adapters/secondary/gateways/ApiFile.gateway";
import { StubFileApiClient } from "../../../../files/adapters/secondary/gateways/StubFile.client";
import { StubEditorProvider } from "../../../../shared-kernel/adapters/primary/react/StubEditorProvider";
import { DeterministicUuidGenerator } from "../../../../shared-kernel/adapters/secondary/providers/deterministicUuidGenerator";
import { StubNodeFileProvider } from "../../../../shared-kernel/adapters/secondary/providers/stubNodeFileProvider";
import { InvalidMimeTypeError } from "../../../../shared-kernel/core-logic/errors/InvalidMimeType.error";
import { ReportSM } from "../../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { expectStoredReportsFactory } from "../../../../test/reports";
import { ApiReportGateway } from "../../../adapters/secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../adapters/secondary/gateways/FakeReport.client";
import { ReportBuilder } from "../../builders/Report.builder";
import { ReportApiModelBuilder } from "../../builders/ReportApiModel.builder";
import { retrieveReport } from "../report-retrieval/retrieveReport.use-case";
import { reportRedoUploadScreenshot } from "./report-redo-upload-screenshot";
export const currentTimestamp = 10;

export const setupTestStore = (editor: StubEditorProvider) => {
  const reportApiClient = new FakeReportApiClient();
  reportApiClient.addReports(aReportApiModel);
  const reportGateway = new ApiReportGateway(reportApiClient);

  const fileApiClient = new StubFileApiClient();

  fileApiClient.signedUrlsVM = [file1FileClientVM, file2FileClientVM];
  const fileGateway = new ApiFileGateway(fileApiClient);

  const fileProvider = new StubNodeFileProvider();
  const uuidGenerator = new DeterministicUuidGenerator();
  uuidGenerator.nextUuids = [fileId1, fileId2];

  const store: ReduxStore = initReduxStore(
    {
      reportGateway,
      fileGateway,
    },
    { fileProvider, uuidGenerator },
    {},
  );
  const initialState = store.getState();

  const expectStoredReports = expectStoredReportsFactory(store, initialState);

  store.dispatch(retrieveReport.fulfilled(aReport, "", ""));

  const givenAPngFile = async () => {
    const fileBuffer = await givenAnImageBuffer("png");
    const file = new File([fileBuffer], fileName1, {
      type: "image/png",
    });
    return file;
  };

  const givenAJpgFile = async () => {
    const fileBuffer = await givenAnImageBuffer("png");
    const file = new File([fileBuffer], fileName2, {
      type: "image/png",
    });
    return file;
  };

  const givenATxtFile = () =>
    new File(["txt content"], "file.txt", {
      type: "text/plain",
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

  const redoUploadScreenshot = (...files: File[]) =>
    store.dispatch(
      reportRedoUploadScreenshot({
        reportId: aReport.id,
        // @ts-expect-error Problème d'appel à la méthode arrayBuffer avec le
        // File du navigateur non investigué
        files,
        editor,
      }),
    );

  const expectStoredScreenshots = (
    ...files: NonNullable<ReportSM["contentScreenshots"]>["files"]
  ) =>
    expectStoredReports({
      ...aReport,
      contentScreenshots: files.length
        ? {
            files,
          }
        : null,
    });

  const expectUploadError = (
    resp: Awaited<ReturnType<typeof redoUploadScreenshot>>,
    fileName: string,
  ) =>
    expect(resp).toMatchObject({
      error: expect.objectContaining({
        message: new InvalidMimeTypeError({
          fileName: fileName,
        }).message,
      }),
    });

  return {
    reportApiClient,
    fileApiClient,
    fileProvider,
    uuidGenerator,
    editor,

    store,
    initialState,

    givenAJpgFile,
    givenAPngFile,
    givenATxtFile,

    redoUploadScreenshot,

    expectStoredReports,
    expectStoredScreenshots,
    expectUploadError,
  };
};

const aReportApiModel = new ReportApiModelBuilder().build();
const aReport = ReportBuilder.fromApiModel(aReportApiModel).buildRetrieveSM();

export const fileId1 = "file-id1";
export const fileId2 = "file-id2";

export const fileName1 = "screenshot1.png-10";
export const fileName2 = "screenshot2.jpg-10";

export const fileName1SignedUrl = "https://example.fr/signed-url1";
export const fileName2SignedUrl = "https://example.fr/signed-url2";

export const file1FileClientVM = {
  name: fileName1,
  signedUrl: fileName1SignedUrl,
};
export const file2FileClientVM = {
  name: fileName2,
  signedUrl: fileName2SignedUrl,
};
