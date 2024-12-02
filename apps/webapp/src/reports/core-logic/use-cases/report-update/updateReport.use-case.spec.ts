import { NominationFile } from "shared-models";
import { ApiReportGateway } from "../../../adapters/secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../adapters/secondary/gateways/FakeReport.client";
import { AppState } from "../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../store/reduxStore";
import { ReportBuilder } from "../../builders/Report.builder";
import { ReportApiModelBuilder } from "../../builders/ReportApiModel.builder";
import { retrieveReport } from "../report-retrieval/retrieveReport.use-case";
import { updateReport, UpdateReportParams } from "./updateReport.use-case";

describe("Report Update", () => {
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
    );
    initialState = store.getState();
  });

  const testData: UpdateReportParams["data"][] = [
    {
      state: NominationFile.ReportState.READY_TO_SUPPORT,
    },
    {
      comment: "new comment",
    },
    {
      state: NominationFile.ReportState.IN_PROGRESS,
      comment: "new comment",
    },
  ];
  it.each(testData)("updates with this new data: %s", async (newData) => {
    reportApiClient.addReport(aReportApiModel);
    store.dispatch(retrieveReport.fulfilled(aReport, "", ""));

    await store.dispatch(
      updateReport({
        reportId: "report-id",
        data: newData,
      }),
    );
    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      reportOverview: {
        byIds: {
          [aReport.id]: {
            ...aReport,
            ...newData,
          },
        },
      },
    });
  });
});

const aReportApiModel = new ReportApiModelBuilder()
  .with("rules.management.TRANSFER_TIME.validated", false)
  .with("state", NominationFile.ReportState.NEW)
  .with("biography", "John Doe's biography")
  .with("comment", "Some comment")
  .build();
const aReport = new ReportBuilder().buildRetrieveVM();
