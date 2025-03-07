import "@testing-library/jest-dom/vitest";
import blobStream from "blob-stream";
import PDF from "pdfkit";
import { ReportFileUsage } from "shared-models";
import sharp, { FormatEnum } from "sharp";
import { FileProvider } from "../../../../shared-kernel/core-logic/providers/fileProvider";
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
import { reportFileAttached } from "../../listeners/report-file-attached.listeners";
import { retrieveReport } from "../report-retrieval/retrieveReport.use-case";
import { attachReportFile, AttachReportFileParams } from "./attach-report-file";
import { ReportApiModelBuilder } from "../../builders/ReportApiModel.builder";

describe("Attach Report File", () => {
  let store: ReduxStore;
  let initialState: AppState<true>;
  let reportApiClient: FakeReportApiClient;
  let expectStoredReports: ExpectStoredReports;
  let uploadUsage: AttachReportFileParams["usage"];

  beforeEach(() => {
    reportApiClient = new FakeReportApiClient();
    reportApiClient.addReports(aReportApiModel);
    const reportGateway = new ApiReportGateway(reportApiClient);
    const fileProvider = new FileProvider();

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

  const testCases: {
    description: string;
    usage: AttachReportFileParams["usage"];
  }[] = [
    {
      description: "Attach files",
      usage: ReportFileUsage.ATTACHMENT,
    },
    {
      description: "Embed screenshots in report content",
      usage: ReportFileUsage.EMBEDDED_SCREENSHOT,
    },
  ];
  describe.each(testCases)("$description", ({ usage }) => {
    uploadUsage = usage;
    it("generates a signed url when a file is attached", async () => {
      const file = await givenAnImageBuffer("png");

      await store.dispatch(
        attachReportFile({
          reportId: "report-id",
          file: new File([file], "file.txt", { type: "image/png" }),
          usage,
        }),
      );
      await sleep(100); // wait for listener to resolve

      expectStoredReports({
        ...aReport,
        attachedFiles: [
          {
            usage,
            signedUrl,
            name: "file.txt",
          },
        ],
      });
    });

    it("refuses to upload a .txt file", async () => {
      const file = genFile("", "file.txt", "text/plain");
      expectUploadError(await attachFile(file), "Invalid mime type: ");
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
  });

  it("attaches a PDF", async () => {
    uploadUsage = ReportFileUsage.ATTACHMENT;
    const fileBuffer = await givenAPdf();
    const file = genFile(fileBuffer, "file.pdf", "application/pdf");
    await expect(attachFile(file)).resolves.toBeDefined();
  });

  it("cannot embed PDF files", async () => {
    uploadUsage = ReportFileUsage.EMBEDDED_SCREENSHOT;
    const fileBuffer = await givenAPdf();
    const file = genFile(fileBuffer, "file.pdf", "application/pdf");
    expectUploadError(
      await attachFile(file),
      "Invalid mime type: application/pdf",
    );
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
        usage: uploadUsage,
      }),
    );

  const givenAPdf = async () =>
    new Promise<Blob>((resolve, reject) => {
      const pdfDoc = new PDF();
      pdfDoc.text("Some content.");
      pdfDoc.end();

      const stream = pdfDoc.pipe(blobStream());

      stream.on("finish", function () {
        resolve(stream.toBlob("application/pdf"));
      });
      stream.on("error", reject);
    });

  const givenAnImageBuffer = async (
    format: Extract<keyof FormatEnum, "png" | "jpg">,
  ) => {
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

const signedUrl = "https://example.fr/file.txt";
const aReportApiModel = new ReportApiModelBuilder().build();
const aReport = ReportBuilder.fromApiModel(aReportApiModel).buildRetrieveSM();
