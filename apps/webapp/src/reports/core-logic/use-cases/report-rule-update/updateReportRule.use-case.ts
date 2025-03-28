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
      extra: {
        gateways: { reportGateway },
      },
    },
  ) => {
    await reportGateway.updateRule(ruleId, validated);
    return { reportId, ruleId, validated };
  },
);
