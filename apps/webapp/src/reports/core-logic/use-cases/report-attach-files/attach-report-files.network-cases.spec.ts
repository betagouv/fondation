import { StubNodeFileProvider } from "../../../../shared-kernel/adapters/secondary/providers/stubNodeFileProvider";
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
import { retrieveReport } from "../report-retrieval/retrieveReport.use-case";
import { attachReportFiles } from "./attach-report-files";

describe("Attach Report Files - Network cases", () => {
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
    );
    initialState = store.getState();

    expectStoredReports = expectStoredReportsFactory(store, initialState);

    store.dispatch(retrieveReport.fulfilled(aReport, "", ""));
  });

  it("stores a pending file", async () => {
    const pdfBuffer = await givenAPdfFile();
    const pdfFile = genFile(pdfBuffer, "file.pdf", "application/pdf");

    store.dispatch(
      attachReportFiles.pending("", {
        reportId: aReport.id,
        files: [pdfFile],
      }),
    );

    expectStoredReports({
      ...aReport,
      attachedFiles: [
        {
          name: "file.pdf",
          fileId: null,
          signedUrl: null,
        },
      ],
    });
  });

  it("removes a file from store if upload failed", async () => {
    const pdfBuffer = await givenAPdfFile();
    const pdfFile = genFile(pdfBuffer, "file.pdf", "application/pdf");
    store.dispatch(
      attachReportFiles.pending("", {
        reportId: aReport.id,
        files: [pdfFile],
      }),
    );

    store.dispatch(
      attachReportFiles.rejected(new Error(), "", {
        reportId: aReport.id,
        files: [pdfFile],
      }),
    );

    expectStoredReports({
      ...aReport,
      attachedFiles: null,
    });
  });

  const genFile = (
    buffer: Buffer | Blob | string,
    name: string,
    type: string,
  ) => new File([buffer], name, { type });

  const givenAPdfFile = async () => {
    fileProvider.mimeType = "application/pdf";
    return givenAPdf();
  };
});

const aReportApiModel = new ReportApiModelBuilder().build();
const aReport = ReportBuilder.fromApiModel(aReportApiModel).buildRetrieveSM();
