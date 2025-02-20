import { NominationFile } from "shared-models";
import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";

export type UpdateReportRuleParams = {
  reportId: string;
  ruleId: string;
  validated: boolean;
};
export type UpdateReportRulePayload = UpdateReportRuleParams;

export const updateReportRule = createAppAsyncThunk<
  UpdateReportRulePayload,
  UpdateReportRuleParams
>(
  "report/updateRule",
  async (
    { reportId, ruleId, validated },
    {
      getState,
      extra: {
        gateways: { reportGateway },
      },
    },
  ) => {
    console.log("getting state");
    const report = getState().reportOverview.byIds?.[reportId];
    console.log(
      "report",
      report?.rules[NominationFile.RuleGroup.MANAGEMENT][
        NominationFile.ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT
      ].id,
      ruleId,
    );
    if (
      report &&
      report.rules[NominationFile.RuleGroup.MANAGEMENT][
        NominationFile.ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT
      ].id === ruleId
    ) {
      console.log("merging");
      const mergedRuleId =
        report.rules[NominationFile.RuleGroup.MANAGEMENT][
          NominationFile.ManagementRule
            .JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE
        ].id;
      await reportGateway.updateRule(mergedRuleId, validated);
    }

    console.log("updating");
    await reportGateway.updateRule(ruleId, validated);
    return { reportId, ruleId, validated };
  },
);
