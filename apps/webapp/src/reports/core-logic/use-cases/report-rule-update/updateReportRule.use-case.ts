import { createAppAsyncThunk } from "../../../store/createAppAsyncThunk";

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
        gateways: { reportGateway: reportGateway },
      },
    },
  ) => {
    await reportGateway.updateRule(ruleId, validated);
    // TODO: React to the updateReport.fulfilled action to dispath a retrieve use case with a listener
    return { reportId, ruleId, validated };
  },
);
