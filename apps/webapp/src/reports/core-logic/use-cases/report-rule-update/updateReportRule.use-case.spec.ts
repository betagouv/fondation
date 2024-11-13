import { FakeReportGateway } from "../../../adapters/secondary/gateways/FakeReport.gateway";
import { AppState } from "../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../store/reduxStore";
import { ReportBuilder } from "../../builders/Report.builder";
import { retrieveReport } from "../report-retrieval/retrieveReport.use-case";
import { updateReportRule } from "./updateReportRule.use-case";

describe("Report Rule Update", () => {
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

  it("switch the transfer time rule from unvalidated to validated", async () => {
    reportGateway.addReport(aNomination);
    store.dispatch(retrieveReport.fulfilled(aNomination, "", ""));
    await store.dispatch(
      updateReportRule({
        reportId: "report-id",
        ruleId: aNomination.rules.management.TRANSFER_TIME.id,
        validated: true,
      }),
    );
    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      reportOverview: {
        byIds: {
          [aNomination.id]: {
            ...aNomination,
            rules: {
              ...aNomination.rules,
              management: {
                ...aNomination.rules.management,
                TRANSFER_TIME: {
                  ...aNomination.rules.management.TRANSFER_TIME,
                  validated: true,
                },
              },
            },
          },
        },
      },
    });
  });
});

const aNomination = new ReportBuilder()
  .withTransferTimeValidated(false)
  .buildRetrieveVM();
