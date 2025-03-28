import { AllRulesMapV2, NominationFile } from "shared-models";
import { AppState } from "../../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import {
  ExpectGatewayReports,
  expectGatewayReportsFactory,
  ExpectStoredReports,
  expectStoredReportsFactory,
} from "../../../../test/reports";
import { ApiReportGateway } from "../../../adapters/secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../adapters/secondary/gateways/FakeReport.client";
import { ReportBuilder } from "../../builders/Report.builder";
import { ReportApiModelBuilder } from "../../builders/ReportApiModel.builder";
import { retrieveReport } from "../report-retrieval/retrieveReport.use-case";
import { updateReportRule } from "./updateReportRule.use-case";

describe("Report Rule Update", () => {
  let store: ReduxStore;
  let initialState: AppState<true>;
  let reportApiClient: FakeReportApiClient;
  let expectStoredReports: ExpectStoredReports;
  let expectGatewayReports: ExpectGatewayReports;

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

    expectStoredReports = expectStoredReportsFactory(store, initialState);
    expectGatewayReports = expectGatewayReportsFactory(reportApiClient);
  });

  describe("Update of a rule", () => {
    const rulesMap: AllRulesMapV2 = {
      [NominationFile.RuleGroup.MANAGEMENT]: [
        NominationFile.ManagementRule.TRANSFER_TIME,
      ],
      [NominationFile.RuleGroup.STATUTORY]: [],
      [NominationFile.RuleGroup.QUALITATIVE]: [],
    };
    const aReportApiModel = new ReportApiModelBuilder(rulesMap)
      .withSomeRules()
      .with("rules.management.TRANSFER_TIME.validated", false)
      .build();
    const aReport =
      ReportBuilder.fromApiModel(aReportApiModel).buildRetrieveSM();

    it("switch the transfer time rule from unvalidated to validated", async () => {
      reportApiClient.addReports(aReportApiModel);
      store.dispatch(retrieveReport.fulfilled(aReport, "", ""));
      await store.dispatch(
        updateReportRule({
          reportId: aReport.id,
          ruleId: aReport.rules.management.TRANSFER_TIME.id,
          validated: true,
        }),
      );

      expectGatewayReports({
        ...aReportApiModel,
        rules: {
          ...aReportApiModel.rules!,
          management: {
            ...aReportApiModel.rules!.management,
            TRANSFER_TIME: {
              ...aReportApiModel.rules!.management.TRANSFER_TIME,
              validated: true,
            },
          },
        },
      });
      expectStoredReports({
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
});
