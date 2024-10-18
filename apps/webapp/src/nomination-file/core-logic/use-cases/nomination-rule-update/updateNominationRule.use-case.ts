import { createAppAsyncThunk } from "../../../store/createAppAsyncThunk";

export type UpdateNominationRuleParams = {
  reportId: string;
  ruleId: string;
  validated: boolean;
};
export type UpdateNominationRulePayload = UpdateNominationRuleParams;

export const updateNominationRule = createAppAsyncThunk<
  UpdateNominationRulePayload,
  UpdateNominationRuleParams
>(
  "nominationFile/updateRule",
  async (
    { reportId, ruleId, validated },
    {
      extra: {
        gateways: { nominationFileGateway: nominationCaseGateway },
      },
    },
  ) => {
    await nominationCaseGateway.updateRule(ruleId, validated);
    // TODO: React to the updateNominationFile.fulfilled action to dispath a retrieve use case with a listener
    return { reportId, ruleId, validated };
  },
);
