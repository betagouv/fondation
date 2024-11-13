import { NominationFile } from "shared-models";
import { FakeReportGateway } from "../../../adapters/secondary/gateways/FakeReport.gateway";
import { AppState } from "../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../store/reduxStore";
import { ReportBuilder } from "../../builders/Report.builder";
import { retrieveReport } from "../report-retrieval/retrieveReport.use-case";
import { updateReport, UpdateReportParams } from "./updateReport.use-case";

describe("Nomination File Update", () => {
  let store: ReduxStore;
  let reportGateway: FakeReportGateway;
  let initialState: AppState;

  beforeEach(() => {
    reportGateway = new FakeReportGateway();
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
    reportGateway.addReport(aNomination);
    store.dispatch(retrieveReport.fulfilled(aNomination, "", ""));

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
          [aNomination.id]: {
            ...aNomination,
            ...newData,
          },
        },
      },
    });
  });
});

const aNomination = new ReportBuilder()
  .withTransferTimeValidated(false)
  .with("state", NominationFile.ReportState.NEW)
  .with("biography", "John Doe's biography")
  .with("comment", "Some comment")
  .buildRetrieveVM();
