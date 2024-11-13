import { RulesBuilder } from "shared-models";

export class ReportSMRulesBuilder extends RulesBuilder {
  constructor() {
    super(({ ruleName }) => ({
      id: ruleName,
      preValidated: true,
      validated: true,
      comment: `${ruleName} comment`,
    }));
  }
}
