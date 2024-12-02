import { ApiReportGateway } from "../../../adapters/secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../adapters/secondary/gateways/FakeReport.client";
import { AppState } from "../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../store/reduxStore";
import { ReportBuilder } from "../../builders/Report.builder";
import { ReportApiModelBuilder } from "../../builders/ReportApiModel.builder";
import { reportFileAttached } from "../../listeners/report-file-attached.listeners";
import { retrieveReport } from "../report-retrieval/retrieveReport.use-case";
import { deleteReportAttachedFile } from "./delete-report-attached-file";

describe("Delete Report Attached File", () => {
  let store: ReduxStore;
  let initialState: AppState;
  let reportApiClient: FakeReportApiClient;

  beforeEach(() => {
    reportApiClient = new FakeReportApiClient();
    reportApiClient.addReport(aReportApiModel);
    const reportGateway = new ApiReportGateway(reportApiClient);
    store = initReduxStore(
      {
        reportGateway,
      },
      {},
      {},
      { reportFileAttached },
    );
    initialState = store.getState();

    store.dispatch(retrieveReport.fulfilled(aReport, "", aReport.id));
  });

  it("deletes a report", async () => {
    store.dispatch(
      deleteReportAttachedFile.fulfilled(undefined, "", {
        reportId: aReport.id,
        fileName: "file.pdf",
      }),
    );

    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      reportOverview: {
        ...initialState.reportOverview,
        byIds: {
          [aReport.id]: {
            ...aReport,
            attachedFiles: [],
          },
        },
      },
    });
  });
});

const aReportApiModel = new ReportApiModelBuilder()
  .with("attachedFiles", [
    {
      signedUrl: "https://example.fr",
      name: "file.pdf",
    },
  ])
  .build();
const aReport = ReportBuilder.fromApiModel(aReportApiModel).buildRetrieveVM();
