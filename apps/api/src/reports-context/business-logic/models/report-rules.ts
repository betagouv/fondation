import { NominationFile } from 'shared-models';

export class ReportRuleValidation {
  constructor(
    readonly ruleGroup: NominationFile.RuleGroup,
    readonly ruleName: NominationFile.RuleName,
    readonly validated: boolean,
  ) {}
}

export type ReportRuleSnapshot = {
  id: string;
  createdAt: Date;
  reportId: string;
  ruleGroup: NominationFile.RuleGroup;
  ruleName: NominationFile.RuleName;
  validated: boolean;
};

export class ReportRule {
  constructor(
    private readonly id: string,
    private readonly createdAt: Date,
    private readonly reportId: string,
    private readonly ruleGroup: NominationFile.RuleGroup,
    private readonly ruleName: NominationFile.RuleName,
    private validated: boolean,
  ) {}

  validate(validated: boolean) {
    this.validated = validated;
  }

  isRuleOfReportId(reportId: string): boolean {
    return this.reportId === reportId;
  }

  isRuleName(
    ruleGroup: NominationFile.RuleGroup,
    ruleName: NominationFile.RuleName,
  ): boolean {
    return this.ruleGroup === ruleGroup && this.ruleName === ruleName;
  }

  getId() {
    return this.id;
  }

  toSnapshot(): ReportRuleSnapshot {
    return {
      id: this.id,
      createdAt: this.createdAt,
      reportId: this.reportId,
      ruleGroup: this.ruleGroup,
      ruleName: this.ruleName,
      validated: this.validated,
    };
  }
  static fromSnapshot(reportRuleSnapshot: ReportRuleSnapshot) {
    return new ReportRule(
      reportRuleSnapshot.id,
      reportRuleSnapshot.createdAt,
      reportRuleSnapshot.reportId,
      reportRuleSnapshot.ruleGroup,
      reportRuleSnapshot.ruleName,
      reportRuleSnapshot.validated,
    );
  }
}
