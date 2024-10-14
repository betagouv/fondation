import { NominationFileManagementRule } from '../../../../../business-logic/models/nomination-file-report';
import {
  NominationFileRuleGroup,
  ReportRule,
} from '../../../../../business-logic/models/report-rules';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ReportPm } from './report-pm';

const ruleNames = [...Object.values(NominationFileManagementRule)];
type RuleNames = (typeof ruleNames)[number];

@Entity({ schema: 'reporter_context', name: 'report_rule' })
export class ReportRulePm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('enum', { name: 'rule_group', enum: NominationFileRuleGroup })
  ruleGroup: NominationFileRuleGroup;

  @Column('enum', {
    name: 'rule_name',
    enum: ruleNames,
  })
  ruleName: RuleNames;

  @Column('boolean', { name: 'pre_validated' })
  preValidated: boolean;

  @Column('boolean', { name: 'validated' })
  validated: boolean;

  @Column('text', { nullable: true })
  comment: string | null;

  @ManyToOne(() => ReportPm)
  report: ReportPm;

  @Column('uuid', { name: 'report_id' })
  reportId: string;

  constructor(
    id: string,
    ruleGroup: NominationFileRuleGroup,
    ruleName: NominationFileManagementRule,
    preValidated: boolean,
    validated: boolean,
    comment: string | null,
    reportId: string,
  ) {
    this.id = id;
    this.ruleGroup = ruleGroup;
    this.ruleName = ruleName;
    this.preValidated = preValidated;
    this.validated = validated;
    this.comment = comment;
    this.reportId = reportId;
  }

  static fromDomain(reportRule: ReportRule): any {
    const reportRuleSnapshot = reportRule.toSnapshot();
    return new ReportRulePm(
      reportRuleSnapshot.id,
      reportRuleSnapshot.ruleGroup,
      reportRuleSnapshot.ruleName,
      reportRuleSnapshot.preValidated,
      reportRuleSnapshot.validated,
      reportRuleSnapshot.comment,
      reportRuleSnapshot.reportId,
    );
  }
}
