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
    const report = getState().reportOverview.byIds?.[reportId];

    if (
      report &&
      report.rules[NominationFile.RuleGroup.MANAGEMENT][
        NominationFile.ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT
      ].id === ruleId
    ) {
      const mergedRuleId =
        report.rules[NominationFile.RuleGroup.MANAGEMENT][
          NominationFile.ManagementRule
            .JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE
        ].id;
      await reportGateway.updateRule(mergedRuleId, validated);
    }

    await reportGateway.updateRule(ruleId, validated);
    return { reportId, ruleId, validated };
  },
);
