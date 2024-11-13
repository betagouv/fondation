import { FakeReportGateway } from "../../../adapters/secondary/gateways/FakeReport.gateway";
import { AppState } from "../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../store/reduxStore";
import { ReportBuilder } from "../../builders/Report.builder";
import { retrieveReport } from "./retrieveReport.use-case";

describe("Retrieve Nomination Case", () => {
  let store: ReduxStore;
  let reportGateway: FakeReportGateway;
  let initialState: AppState;

  beforeEach(() => {
    reportGateway = new FakeReportGateway();
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
    reportGateway.addReport(aNomination);
    await store.dispatch(retrieveReport("report-id"));
    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      reportOverview: { byIds: { [aNomination.id]: aNomination } },
    });
  });

  it("has two nomination cases in the store after retrieving a second one", async () => {
    reportGateway.addReport(aNomination);
    store.dispatch(retrieveReport.fulfilled(anotherNomination, "", ""));

    await store.dispatch(retrieveReport("report-id"));

    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      reportOverview: {
        byIds: {
          [aNomination.id]: aNomination,
          [anotherNomination.id]: anotherNomination,
        },
      },
    });
  });
});

const aNomination = new ReportBuilder().buildRetrieveVM();

const anotherNomination = new ReportBuilder()
  .with("id", "another-report-id")
  .buildRetrieveVM();
