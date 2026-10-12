import { Prisma, PrismaRuleGroupEnum, PrismaRuleNameEnum } from 'src/generated/prisma/client';

export function getAllNominationSessionReportRules(): Prisma.ReportRuleCreateManyReportInput[] {
  const managementRules: readonly [PrismaRuleGroupEnum, PrismaRuleNameEnum][] = (
    ['TRANSFER_TIME', 'GETTING_GRADE_IN_PLACE', 'JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT'] as const
  ).map((ruleName) => ['management', ruleName] as const);

  const statutoryRules: readonly [PrismaRuleGroupEnum, PrismaRuleNameEnum][] = (
    [
      'JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION',
      'GRADE_ON_SITE_AFTER_7_YEARS',
      'MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS',
      'MINISTER_CABINET',
      'GRADE_REGISTRATION',
      'HH_WITHOUT_2_FIRST_GRADE_POSITIONS',
      'LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO',
      'RETOUR_AVANT_5_ANS_DANS_FONCTION_SPECIALISEE_OCCUPEE_9_ANS',
      'NOMINATION_CA_AVANT_4_ANS',
    ] as const
  ).map((ruleName) => ['statutory', ruleName] as const);

  const qualitativeRules: readonly [PrismaRuleGroupEnum, PrismaRuleNameEnum][] = (
    [
      'CONFLICT_OF_INTEREST_PRE_MAGISTRATURE',
      'CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION',
      'EVALUATIONS',
      'DISCIPLINARY_ELEMENTS',
    ] as const
  ).map((ruleName) => ['qualitative', ruleName] as const);

  return ([managementRules, statutoryRules, qualitativeRules] as const).flatMap((tuples) =>
    tuples.map(
      ([ruleGroup, ruleName]) =>
        ({ ruleGroup, ruleName, validated: false }) satisfies Prisma.ReportRuleCreateManyReportInput,
    ),
  );
}
