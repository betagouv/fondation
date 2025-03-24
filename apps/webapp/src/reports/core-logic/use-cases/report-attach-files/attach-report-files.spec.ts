import "@testing-library/jest-dom/vitest";
import blobStream from "blob-stream";
import PDF from "pdfkit";
import { ReportFileUsage } from "shared-models";
import sharp, { FormatEnum } from "sharp";
import { StubNodeFileProvider } from "../../../../shared-kernel/adapters/secondary/providers/stubNodeFileProvider";
import { sleep } from "../../../../shared-kernel/core-logic/sleep";
import { AppState } from "../../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
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

describe("Attach Multiple Report Files", () => {
  let store: ReduxStore;
  let initialState: AppState<true>;
  let reportApiClient: FakeReportApiClient;
  let fileProvider: StubNodeFileProvider;
  let expectStoredReports: ExpectStoredReports;

  beforeEach(() => {
    reportApiClient = new FakeReportApiClient();
    reportApiClient.addReports(aReportApiModel);
    const reportGateway = new ApiReportGateway(reportApiClient);
    fileProvider = new StubNodeFileProvider();

    store = initReduxStore(
      {
        reportGateway,
      },
      { fileProvider },
      {},
      { reportFilesAttached },
    );
    initialState = store.getState();

    expectStoredReports = expectStoredReportsFactory(store, initialState);

    store.dispatch(retrieveReport.fulfilled(aReport, "", ""));
  });

  it("attaches two files simultaneously", async () => {
    const pdfBuffer = await givenAPdf();
    const pdfFile = genFile(pdfBuffer, "file.pdf", "application/pdf");

    const pngBuffer = await givenAnImageBuffer("png");
    const pngFile = genFile(pngBuffer, "image.png", "image/png");

    await attachFiles([pdfFile, pngFile]);
    await sleep(100); // wait for listener to resolve

    expectStoredReports({
      ...aReport,
      attachedFiles: [
        {
          usage: ReportFileUsage.ATTACHMENT,
          signedUrl: "https://example.fr/file.pdf",
          name: "file.pdf",
        },
        {
          usage: ReportFileUsage.ATTACHMENT,
          signedUrl: "https://example.fr/image.png",
          name: "image.png",
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
          usage: ReportFileUsage.ATTACHMENT,
          signedUrl: `${FakeReportApiClient.BASE_URI}/image1.png`,
          name: "image1.png",
        },
        {
          usage: ReportFileUsage.ATTACHMENT,
          signedUrl: `${FakeReportApiClient.BASE_URI}/image2.jpg`,
          name: "image2.jpg",
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

  const givenAPdf = async () => {
    fileProvider.mimeType = "application/pdf";
    return new Promise<Blob>((resolve, reject) => {
      const pdfDoc = new PDF();
      pdfDoc.text("Some content.");
      pdfDoc.end();

      const stream = pdfDoc.pipe(blobStream());

      stream.on("finish", function () {
        resolve(stream.toBlob("application/pdf"));
      });
      stream.on("error", reject);
    });
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
