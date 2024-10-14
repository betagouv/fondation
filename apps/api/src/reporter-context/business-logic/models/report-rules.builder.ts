import { NominationFile } from '@/shared-models';
import { NominationFileManagementRule } from './nomination-file-report';
import { ReportRule } from './report-rules';

export class ReportRuleBuilder {
  private id: string;
  private reportId: string;
  private ruleGroup: NominationFile.RuleGroup;
  private ruleName: NominationFileManagementRule;
  private preValidated: boolean;
  private validated: boolean;
  private comment: string | null;

  constructor() {
    this.id = 'rule-id';
    this.reportId = 'report-id';
    this.ruleGroup = NominationFile.RuleGroup.MANAGEMENT;
    this.ruleName = NominationFileManagementRule.OVERSEAS_TO_OVERSEAS;
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
  withOverseasToOverseasRuleValidated(validated: boolean): this {
    this.ruleGroup = NominationFile.RuleGroup.MANAGEMENT;
    this.ruleName = NominationFileManagementRule.OVERSEAS_TO_OVERSEAS;
    this.validated = validated;
    return this;
  }

  build(): ReportRule {
    return new ReportRule(
      this.id,
      this.reportId,
      this.ruleGroup,
      this.ruleName,
      this.preValidated,
      this.validated,
      this.comment,
    );
  }
}
