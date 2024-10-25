import { NominationFile } from 'shared-models';
import { ReportRule } from './report-rules';

export class ReportRuleBuilder {
  private id: string;
  private createdAt: Date;
  private reportId: string;
  private ruleGroup: NominationFile.RuleGroup;
  private ruleName: NominationFile.RuleName;
  private preValidated: boolean;
  private validated: boolean;
  private comment: string | null;

  constructor() {
    this.id = 'rule-id';
    this.createdAt = new Date(2021, 1, 1);
    this.reportId = 'report-id';
    this.ruleGroup = NominationFile.RuleGroup.MANAGEMENT;
    this.ruleName = NominationFile.ManagementRule.OVERSEAS_TO_OVERSEAS;
    this.preValidated = true;
    this.validated = true;
    this.comment = 'rule comment';
  }

  withId(id: string): this {
    this.id = id;
    return this;
  }
  withReportId(id: string) {
    this.reportId = id;
    return this;
  }
  withRuleGroup(ruleGroup: NominationFile.RuleGroup): this {
    this.ruleGroup = ruleGroup;
    return this;
  }
  withRuleName(ruleName: NominationFile.RuleName): this {
    this.ruleName = ruleName;
    return this;
  }
  withPreValidated(preValidated: boolean): this {
    this.preValidated = preValidated;
    return this;
  }
  withValidated(validated: boolean): this {
    this.validated = validated;
    return this;
  }
  withOverseasToOverseasRuleValidated(validated: boolean): this {
    this.ruleGroup = NominationFile.RuleGroup.MANAGEMENT;
    this.ruleName = NominationFile.ManagementRule.OVERSEAS_TO_OVERSEAS;
    this.validated = validated;
    return this;
  }
  withComment(comment: string | null): this {
    this.comment = comment;
    return this;
  }

  build(): ReportRule {
    return new ReportRule(
      this.id,
      this.createdAt,
      this.reportId,
      this.ruleGroup,
      this.ruleName,
      this.preValidated,
      this.validated,
      this.comment,
    );
  }
}
