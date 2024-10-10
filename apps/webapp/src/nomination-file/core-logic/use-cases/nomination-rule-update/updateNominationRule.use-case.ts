import { RuleGroup, RuleName } from "../../../store/appState";
import { createAppAsyncThunk } from "../../../store/createAppAsyncThunk";

export type UpdateNominationRuleParams = {
  id: string;
  ruleGroup: RuleGroup;
  ruleName: RuleName;
  validated: boolean;
};
export type UpdateNominationRulePayload = UpdateNominationRuleParams;

export const updateNominationRule = createAppAsyncThunk<
  UpdateNominationRulePayload,
  UpdateNominationRuleParams
>(
  "nominationFile/updateRule",
  async (
    { id, ruleGroup, ruleName, validated },
    {
      extra: {
        gateways: { nominationCaseGateway },
      },
    },
  ) => {
    await nominationCaseGateway.updateRule(id, ruleGroup, ruleName, validated);
    // TODO: React to the updateNominationFile.fulfilled action to dispath a retrieve use case with a listener
    return { id, ruleGroup, ruleName, validated };
  },
);
