import "@testing-library/jest-dom/vitest";
import sharp, { FormatEnum } from "sharp";
import { StubNodeFileProvider } from "../../../../shared-kernel/adapters/secondary/providers/stubNodeFileProvider";
import { sleep } from "../../../../shared-kernel/core-logic/sleep";
import { AppState } from "../../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { givenAPdf } from "../../../../test/files";
import {
  ExpectStoredReports,
  expectStoredReportsFactory,
} from "../../../../test/reports";
import { ApiReportGateway } from "../../../adapters/secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../adapters/secondary/gateways/FakeReport.client";
import { ReportBuilder } from "../../builders/Report.builder";
import { ReportApiModelBuilder } from "../../builders/ReportApiModel.builder";
import { reportFilesAttached } from "../../listeners/report-files-attached.listeners";
import { retrieveReport } from "../report-retrieval/retrieveReport.use-case";
import { attachReportFiles } from "./attach-report-files";
import { DeterministicUuidGenerator } from "../../../../shared-kernel/adapters/secondary/providers/deterministicUuidGenerator";

describe("Attach Report Files", () => {
  let store: ReduxStore;
  let initialState: AppState<true>;
  let reportApiClient: FakeReportApiClient;
  let fileProvider: StubNodeFileProvider;
  let uuidGenerator: DeterministicUuidGenerator;
  let expectStoredReports: ExpectStoredReports;

  beforeEach(() => {
    reportApiClient = new FakeReportApiClient();
    reportApiClient.addReports(aReportApiModel);
    const reportGateway = new ApiReportGateway(reportApiClient);
    fileProvider = new StubNodeFileProvider();
    uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [fileId1, fileId2];

    store = initReduxStore(
      {
        reportGateway,
      },
      { fileProvider, uuidGenerator },
      {},
      { reportFilesAttached },
    );
    initialState = store.getState();

    expectStoredReports = expectStoredReportsFactory(store, initialState);

    store.dispatch(retrieveReport.fulfilled(aReport, "", ""));
  });

  it("attaches two files simultaneously", async () => {
    const pdfBuffer = await givenAPdfFile();
    const pdfFile = genFile(pdfBuffer, "file.pdf", "application/pdf");

    const pngBuffer = await givenAnImageBuffer("png");
    const pngFile = genFile(pngBuffer, "image.png", "image/png");

    await attachFiles([pdfFile, pngFile]);
    await sleep(100); // wait for listener to resolve

    expectStoredReports({
      ...aReport,
      attachedFiles: [
        {
          signedUrl: "https://example.fr/file.pdf",
          name: "file.pdf",
          fileId: fileId1,
        },
        {
          signedUrl: "https://example.fr/image.png",
          name: "image.png",
          fileId: fileId2,
        },
      ],
    });
  });

  it("refuses to upload if any file has an invalid mime type", async () => {
    const invalidFile = genFile("", "file.txt", "text/plain");

    expectUploadError(
      await attachFiles([invalidFile]),
      "Invalid mime type for file file.txt: ",
    );

    expectStoredReports({
      ...aReport,
      attachedFiles: null,
    });
  });

  it("attaches multiple image files of different formats", async () => {
    const pngBuffer = await givenAnImageBuffer("png");
    const pngFile = genFile(pngBuffer, "image1.png", "image/png");

    const jpgBuffer = await givenAnImageBuffer("jpg");
    const jpgFile = genFile(jpgBuffer, "image2.jpg", "image/jpg");

    await attachFiles([pngFile, jpgFile]);
    await sleep(100); // wait for listener to resolve

    expectStoredReports({
      ...aReport,
      attachedFiles: [
        {
          signedUrl: `${FakeReportApiClient.BASE_URI}/image1.png`,
          name: "image1.png",
          fileId: fileId1,
        },
        {
          signedUrl: `${FakeReportApiClient.BASE_URI}/image2.jpg`,
          name: "image2.jpg",
          fileId: fileId2,
        },
      ],
    });
  });

  const genFile = (
    buffer: Buffer | Blob | string,
    name: string,
    type: string,
  ) => new File([buffer], name, { type });

  const attachFiles = (files: File[]) =>
    store.dispatch(
      attachReportFiles({
        reportId: aReport.id,
        files,
      }),
    );

  const givenAPdfFile = async () => {
    fileProvider.mimeType = "application/pdf";
    return givenAPdf();
  };

  const givenAnImageBuffer = async (
    format: Extract<keyof FormatEnum, "png" | "jpg">,
  ) => {
    fileProvider.mimeType = `image/${format === "jpg" ? "jpeg" : format}`;
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
    resp: Awaited<ReturnType<typeof attachFiles>>,
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

const fileId1 = "file-id1";
const fileId2 = "file-id2";
