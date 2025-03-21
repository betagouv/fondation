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
import { reportFileAttached } from "../../listeners/report-file-attached.listeners";
import { retrieveReport } from "../report-retrieval/retrieveReport.use-case";
import { attachReportFile } from "./attach-report-file";

describe("Attach Report File", () => {
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
      { reportFileAttached },
    );
    initialState = store.getState();

    expectStoredReports = expectStoredReportsFactory(store, initialState);

    store.dispatch(retrieveReport.fulfilled(aReport, "", ""));
  });

  it("attaches a PDF", async () => {
    const fileBuffer = await givenAPdf();
    const file = genFile(fileBuffer, "file.pdf", "application/pdf");
    await expect(attachFile(file)).resolves.toBeDefined();
  });

  it("generates a signed url when a file is attached", async () => {
    const file = await givenAnImageBuffer("png");

    await attachFile(new File([file], "file.png", { type: "image/png" }));
    await sleep(100); // wait for listener to resolve

    expectStoredReports({
      ...aReport,
      attachedFiles: [
        {
          usage: ReportFileUsage.ATTACHMENT,
          signedUrl: "https://example.fr/file.png",
          name: "file.png",
        },
      ],
    });
  });

  it("refuses to upload an unknown file type", async () => {
    const file = genFile("", "file.txt", "text/plain");
    expectUploadError(await attachFile(file), "Invalid mime type: ");
  });

  it("refuses to upload an forbidden file type", async () => {
    fileProvider.mimeType = "text/plain";
    const file = genFile("", "file.txt", "text/plain");
    expectUploadError(await attachFile(file), "Invalid mime type: text/plain");
  });

  it.each`
    format
    ${"png"}
    ${"jpg"}
  `("attaches a $format image", async ({ format }) => {
    const fileBuffer = await givenAnImageBuffer(format);
    const file = genFile(fileBuffer, `file.${format}`, `images/${format}`);
    await expect(attachFile(file)).resolves.toBeDefined();
  });

  const genFile = (
    buffer: Buffer | Blob | string,
    name: string,
    type: string,
  ) => new File([buffer], name, { type });

  const attachFile = (file: File) =>
    store.dispatch(
      attachReportFile({
        reportId: aReport.id,
        file,
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
    resp: Awaited<ReturnType<typeof attachFile>>,
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
