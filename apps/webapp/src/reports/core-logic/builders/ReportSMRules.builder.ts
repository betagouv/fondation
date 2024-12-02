import { RulesBuilder } from "shared-models";

export class ReportSMRulesBuilder extends RulesBuilder {
  constructor() {
    super(({ ruleGroup, ruleName }) => ({
      id: `${ruleGroup}-${ruleName}`,
      preValidated: true,
      validated: true,
      comment: `${ruleName} comment`,
    }));
  }
}
