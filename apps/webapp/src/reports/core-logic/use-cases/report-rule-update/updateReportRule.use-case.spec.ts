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
        NominationFile.ManagementRule
          .JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE,
        NominationFile.ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT,
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

  describe("Merge of JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE with JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT", () => {
    const rulesMap: AllRulesMapV2 = {
      [NominationFile.RuleGroup.MANAGEMENT]: [
        NominationFile.ManagementRule
          .JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE,
        NominationFile.ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT,
      ],
      [NominationFile.RuleGroup.STATUTORY]: [],
      [NominationFile.RuleGroup.QUALITATIVE]: [],
    };

    const aReportApiModelBuilder = new ReportApiModelBuilder(
      rulesMap,
    ).withSomeRules();

    it.each`
      mergedRuleValidated | ruleValidated | expectedValidated
      ${true}             | ${false}      | ${true}
      ${false}            | ${true}       | ${true}
      ${false}            | ${false}      | ${true}
      ${true}             | ${true}       | ${false}
    `(
      "validates both merged rules when one of them is validated",
      async ({ mergedRuleValidated, ruleValidated, expectedValidated }) => {
        const aReportApiModel = aReportApiModelBuilder
          .with(
            "rules.management.JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE",
            {
              id: `${NominationFile.RuleGroup.MANAGEMENT}-${NominationFile.ManagementRule.JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE}`,
              validated: mergedRuleValidated,
              preValidated: false,
              comment: null,
            },
          )
          .with("rules.management.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT", {
            id: `${NominationFile.RuleGroup.MANAGEMENT}-${NominationFile.ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT}`,
            validated: ruleValidated,
            preValidated: false,
            comment: null,
          })
          .build();
        const aReport =
          ReportBuilder.fromApiModel(aReportApiModel).buildRetrieveSM();

        reportApiClient.addReports(aReportApiModel);
        store.dispatch(retrieveReport.fulfilled(aReport, "", ""));

        await store.dispatch(
          updateReportRule({
            reportId: aReport.id,
            ruleId:
              aReport.rules.management.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT.id,
            validated: expectedValidated,
          }),
        );

        expectGatewayReports({
          ...aReportApiModel,
          rules: {
            ...aReportApiModel.rules!,
            management: {
              ...aReportApiModel.rules!.management,
              JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE: {
                ...aReportApiModel.rules!.management
                  .JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE,
                validated: expectedValidated,
              },
              JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT: {
                ...aReportApiModel.rules!.management
                  .JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT,
                validated: expectedValidated,
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
              JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE: {
                ...aReport.rules.management
                  .JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE,
                validated: expectedValidated,
              },
              JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT: {
                ...aReport.rules.management
                  .JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT,
                validated: expectedValidated,
              },
            },
          },
        });
      },
    );
  });
});
