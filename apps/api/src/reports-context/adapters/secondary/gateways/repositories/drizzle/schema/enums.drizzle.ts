import { Magistrat, NominationFile, Transparency } from 'shared-models';
import { pgEnum } from 'drizzle-orm/pg-core';
import { reportsContextSchema } from './reports-context-schema.drizzle';

export const reportStateEnum = pgEnum(
  'report_state',
  Object.values(NominationFile.ReportState) as [
    NominationFile.ReportState,
    ...NominationFile.ReportState[],
  ],
);

export const formationEnum = pgEnum(
  'formation',
  Object.values(Magistrat.Formation) as [
    Magistrat.Formation,
    ...Magistrat.Formation[],
  ],
);

export const transparencyEnum = pgEnum(
  'transparency',
  Object.values(Transparency) as [Transparency, ...Transparency[]],
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
