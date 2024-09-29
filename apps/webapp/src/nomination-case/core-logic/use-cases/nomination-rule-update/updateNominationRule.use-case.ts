import { createAsyncThunk } from "@reduxjs/toolkit";
import { RuleGroup, RuleName } from "../../../store/appState";
import { Gateways } from "../../../store/reduxStore";

export type UpdateNominationRuleParams = {
  id: string;
  ruleGroup: RuleGroup;
  ruleName: RuleName;
  validated: boolean;
};
export type UpdateNominationRulePayload = UpdateNominationRuleParams;

export const updateNominationRule = createAsyncThunk<
  UpdateNominationRulePayload,
  UpdateNominationRuleParams,
  {
    extra: Gateways;
  }
>(
  "nominationCase/updateRule",
  async (
    { id, ruleGroup, ruleName, validated },
    { extra: { nominationCaseGateway } }
  ) => {
    const updatedNominationCase = {
      preValidatedRules: {
        [ruleGroup]: {
          [ruleName]: validated,
        },
      },
    };
    await nominationCaseGateway.updateNominationCase(id, updatedNominationCase);
    // TODO: React to the updateNominationCase.fulfilled action to dispath a retrieve use case with a listener
    return { id, ruleGroup, ruleName, validated };
  }
);
