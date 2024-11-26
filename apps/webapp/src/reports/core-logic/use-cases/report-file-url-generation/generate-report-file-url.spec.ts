import { FakeReportGateway } from "../../../adapters/secondary/gateways/FakeReport.gateway";
import { AppState } from "../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../store/reduxStore";
import { ReportBuilder } from "../../builders/Report.builder";
import { retrieveReport } from "../report-retrieval/retrieveReport.use-case";
import { generateReportFileUrl } from "./generate-report-file-url";

describe("Generate Report File Url", () => {
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
    );
    initialState = store.getState();
  });

  it("generates a report file url", async () => {
    store.dispatch(retrieveReport.fulfilled(aReport, "", ""));
    await store.dispatch(
      generateReportFileUrl({
        reportId: aReport.id,
        fileName: "file.txt",
      }),
    );
    expect(store.getState()).toEqual({
      ...initialState,
      reportOverview: {
        byIds: {
          [aReport.id]: {
            ...aReport,
            attachedFiles: [
              {
                signedUrl: signedUrl,
                name: "file.txt",
              },
            ],
          },
        },
      },
    });
  });
});

const signedUrl = "https://example.fr/file.txt";

const aReport = new ReportBuilder()
  .with("attachedFiles", [
    {
      name: "file.txt",
      signedUrl: signedUrl,
    },
  ])
  .buildRetrieveVM();
