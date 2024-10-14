import { NominationFileManagementRule } from './nomination-file-report';

export enum NominationFileRuleGroup {
  MANAGEMENT = 'management',
  STATUTORY = 'statutory',
  QUALITATIVE = 'qualitative',
}

export type NominationFileRuleValue = {
  preValidated: boolean;
  validated: boolean;
  comment: string | null;
};

export type NominationFileRules = {
  [NominationFileRuleGroup.MANAGEMENT]: {
    [key in NominationFileManagementRule]: NominationFileRuleValue;
  };
  [NominationFileRuleGroup.STATUTORY]: {
    [key: string]: NominationFileRuleValue;
  };
  [NominationFileRuleGroup.QUALITATIVE]: {
    [key: string]: NominationFileRuleValue;
  };
};

export class ReportRuleValidation {
  constructor(
    readonly ruleGroup: NominationFileRuleGroup,
    readonly ruleName: NominationFileManagementRule,
    readonly preValidated: boolean,
    readonly validated: boolean,
  ) {}
}

export type ReportRuleSnapshot = {
  id: string;
  reportId: string;
  ruleGroup: NominationFileRuleGroup;
  ruleName: NominationFileManagementRule;
  preValidated: boolean;
  validated: boolean;
  comment: string | null;
};

export class ReportRule {
  constructor(
    private readonly id: string,
    private readonly reportId: string,
    private readonly ruleGroup: NominationFileRuleGroup,
    private readonly ruleName: NominationFileManagementRule,
    private readonly preValidated: boolean,
    private validated: boolean,
    private readonly comment: string | null,
  ) {}

  validate(validated: boolean) {
    this.validated = validated;
  }

  getId() {
    return this.id;
  }

  toSnapshot(): ReportRuleSnapshot {
    return {
      id: this.id,
      reportId: this.reportId,
      ruleGroup: this.ruleGroup,
      ruleName: this.ruleName,
      preValidated: this.preValidated,
      validated: this.validated,
      comment: this.comment,
    };
  }
  static fromSnapshot(reportRuleSnapshot: ReportRuleSnapshot) {
    return new ReportRule(
      reportRuleSnapshot.id,
      reportRuleSnapshot.reportId,
      reportRuleSnapshot.ruleGroup,
      reportRuleSnapshot.ruleName,
      reportRuleSnapshot.preValidated,
      reportRuleSnapshot.validated,
      reportRuleSnapshot.comment,
    );
  }
}
