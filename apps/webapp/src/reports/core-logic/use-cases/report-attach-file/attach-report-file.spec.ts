import { FakeReportGateway } from "../../../adapters/secondary/gateways/FakeReport.gateway";
import { AppState } from "../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../store/reduxStore";
import { ReportBuilder } from "../../builders/Report.builder";
import { reportFileAttached } from "../../listeners/report-file-attached.listeners";
import { retrieveReport } from "../report-retrieval/retrieveReport.use-case";
import { attachReportFile } from "./attach-report-file";
import PDF from "pdfkit";
import sharp, { FormatEnum } from "sharp";
import blobStream from "blob-stream";
import "@testing-library/jest-dom/vitest";

describe("Attach Report File", () => {
  let store: ReduxStore;
  let initialState: AppState;
  let reportGateway: FakeReportGateway;

  beforeEach(() => {
    reportGateway = new FakeReportGateway();
    reportGateway.addReport(aReport);
    store = initReduxStore(
      {
        reportGateway,
      },
      {},
      {},
      { reportFileAttached },
    );
    initialState = store.getState();

    store.dispatch(retrieveReport.fulfilled(aReport, "", ""));
  });

  it("generates a signed url when a file is attached", async () => {
    const file = await givenAnImageBuffer("png");

    await store.dispatch(
      attachReportFile({
        reportId: "report-id",
        file: new File([file], "file.txt", { type: "image/png" }),
      }),
    );
    await sleep(100); // wait for listener to resolve

    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      reportOverview: {
        byIds: {
          [aReport.id]: {
            ...aReport,
            attachedFiles: [
              {
                signedUrl,
                name: "file.txt",
              },
            ],
          },
        },
      },
    });
  });

  it("refuses to uplaod a .txt file", async () => {
    const file = genFile("", "file.txt", "text/plain");
    expect(await attachFile(file)).toMatchObject({
      error: expect.objectContaining({ message: "Invalid file type" }),
    });
  });

  it.each`
    format
    ${"png"}
    ${"jpg"}
  `("attaches a $format image", async ({ format }) => {
    const fileBuffer = await givenAnImageBuffer(format);
    const file = genFile(fileBuffer, `file.${format}`, `images/${format}`);
    expect(attachFile(file)).resolves.toBeDefined();
  });

  it("attaches a pdf", async () => {
    const fileBuffer = await givenAPdf();
    const file = genFile(fileBuffer, "file.pdf", "application/pdf");
    expect(attachFile(file)).resolves.toBeDefined();
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
});

const signedUrl = "https://example.fr/file.txt";
const aReport = new ReportBuilder().buildRetrieveVM();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
