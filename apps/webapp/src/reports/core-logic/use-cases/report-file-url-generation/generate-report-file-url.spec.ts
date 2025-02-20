import { ApiReportGateway } from "../../../adapters/secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../adapters/secondary/gateways/FakeReport.client";
import { AppState } from "../../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import { ReportBuilder } from "../../builders/Report.builder";
import { ReportApiModelBuilder } from "../../builders/ReportApiModel.builder";
import { retrieveReport } from "../report-retrieval/retrieveReport.use-case";
import { generateReportFileUrl } from "./generate-report-file-url";
import {
  ExpectStoredReports,
  expectStoredReportsFactory,
} from "../../../../test/reports";

describe("Generate Report File Url", () => {
  let store: ReduxStore;
  let initialState: AppState<true>;
  let reportApiClient: FakeReportApiClient;
  let expectStoredReports: ExpectStoredReports;

  beforeEach(() => {
    reportApiClient = new FakeReportApiClient();
    reportApiClient.addReports(aReportApiModel);
    const reportGateway = new ApiReportGateway(reportApiClient);

    store = initReduxStore(
      {
        reportGateway,
      },
      {},
      {},
    );
    initialState = store.getState();

    expectStoredReports = expectStoredReportsFactory(store, initialState);
  });

  it("generates a report file url", async () => {
    store.dispatch(retrieveReport.fulfilled(aReport, "", ""));
    await store.dispatch(
      generateReportFileUrl({
        reportId: aReport.id,
        fileName: "file.txt",
      }),
    );
    expectStoredReports({
      ...aReport,
      attachedFiles: [
        {
          signedUrl: signedUrl,
          name: "file.txt",
        },
      ],
    });
  });
});

const signedUrl = "https://example.fr/file.txt";

const aReportApiModel = new ReportApiModelBuilder()
  .with("attachedFiles", [
    {
      name: "file.txt",
      signedUrl: signedUrl,
    },
  ])
  .build();
const aReport = ReportBuilder.fromApiModel(aReportApiModel).buildRetrieveSM();
