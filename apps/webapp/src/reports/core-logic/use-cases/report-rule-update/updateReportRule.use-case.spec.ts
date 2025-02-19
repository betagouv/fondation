import { ApiReportGateway } from "../../../adapters/secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../adapters/secondary/gateways/FakeReport.client";
import { AppState } from "../../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import { ReportBuilder } from "../../builders/Report.builder";
import { ReportApiModelBuilder } from "../../builders/ReportApiModel.builder";
import { retrieveReport } from "../report-retrieval/retrieveReport.use-case";
import { updateReportRule } from "./updateReportRule.use-case";
import { ExpectReports, expectReportsFactory } from "../../../../test/reports";

describe("Report Rule Update", () => {
  let store: ReduxStore;
  let initialState: AppState<true>;
  let reportApiClient: FakeReportApiClient;
  let expectReports: ExpectReports;

  beforeEach(() => {
    reportApiClient = new FakeReportApiClient();
    const reportGateway = new ApiReportGateway(reportApiClient);
    store = initReduxStore(
      {
        reportGateway,
      },
      {},
      {},
    );
    initialState = store.getState();

    expectReports = expectReportsFactory(store, initialState);
  });

  it("switch the transfer time rule from unvalidated to validated", async () => {
    reportApiClient.addReports(aReportApiModel);
    store.dispatch(retrieveReport.fulfilled(aReport, "", ""));
    await store.dispatch(
      updateReportRule({
        reportId: "report-id",
        ruleId: aReport.rules.management.TRANSFER_TIME.id,
        validated: true,
      }),
    );
    expectReports({
      ...aReport,
      rules: {
        ...aReport.rules,
        management: {
          ...aReport.rules.management,
          TRANSFER_TIME: {
            ...aReport.rules.management.TRANSFER_TIME,
            validated: true,
          },
        },
      },
    });
  });
});

const aReportApiModel = new ReportApiModelBuilder()
  .withSomeRules()
  .with("rules.management.TRANSFER_TIME.validated", false)
  .build();
const aReport = ReportBuilder.fromApiModel(aReportApiModel).buildRetrieveSM();
