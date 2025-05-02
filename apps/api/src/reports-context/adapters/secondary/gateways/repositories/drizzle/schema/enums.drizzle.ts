import { pgEnum } from 'drizzle-orm/pg-core';
import { Magistrat, NominationFile } from 'shared-models';
import { reportsContextSchema } from './reports-context-schema.drizzle';

export const reportStateEnum = pgEnum(
  'report_state',
  Object.values(NominationFile.ReportState) as [
    NominationFile.ReportState,
    ...NominationFile.ReportState[],
  ],
);

export const gradeEnum = pgEnum(
  'grade',
  Object.values(Magistrat.Grade) as [Magistrat.Grade, ...Magistrat.Grade[]],
);

export const ruleGroupEnum = reportsContextSchema.enum(
  'rule_group',
  Object.values(NominationFile.RuleGroup) as [
    NominationFile.RuleGroup,
    ...NominationFile.RuleGroup[],
  ],
);

const ruleNames = [
  ...Object.values(NominationFile.ManagementRule),
  ...Object.values(NominationFile.StatutoryRule),
  ...Object.values(NominationFile.QualitativeRule),
] as [NominationFile.RuleName, ...NominationFile.RuleName[]];
export const ruleNameEnum = reportsContextSchema.enum('rule_name', ruleNames);
