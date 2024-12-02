import { ApiReportGateway } from "../../../adapters/secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../adapters/secondary/gateways/FakeReport.client";
import { AppState } from "../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../store/reduxStore";
import { ReportBuilder } from "../../builders/Report.builder";
import { ReportApiModelBuilder } from "../../builders/ReportApiModel.builder";
import { retrieveReport } from "./retrieveReport.use-case";

describe("Retrieve Nomination Case", () => {
  let store: ReduxStore;
  let initialState: AppState;
  let reportApiClient: FakeReportApiClient;

  beforeEach(() => {
    reportApiClient = new FakeReportApiClient();
    const reportGateway = new ApiReportGateway(reportApiClient);
    store = initReduxStore(
      {
        reportGateway: reportGateway,
      },
      {},
      {},
    );
    initialState = store.getState();
  });

  it("retrieve a nomination file", async () => {
    reportApiClient.addReport(aReportApiModel);
    await store.dispatch(retrieveReport("report-id"));
    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      reportOverview: { byIds: { [aReport.id]: aReport } },
    });
  });

  it("has two nomination cases in the store after retrieving a second one", async () => {
    reportApiClient.addReport(aReportApiModel);
    store.dispatch(retrieveReport.fulfilled(anotherNomination, "", ""));

    await store.dispatch(retrieveReport("report-id"));

    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      reportOverview: {
        byIds: {
          [aReport.id]: aReport,
          [anotherNomination.id]: anotherNomination,
        },
      },
    });
  });
});

const aReportApiModel = new ReportApiModelBuilder().build();
const aReport = ReportBuilder.fromApiModel(aReportApiModel).buildRetrieveVM();

const anotherNomination = new ReportBuilder()
  .with("id", "another-report-id")
  .buildRetrieveVM();
