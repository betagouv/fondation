import { NominationFile } from 'shared-models';
import {
  Prisma,
  PrismaRuleGroupEnum,
  PrismaRuleNameEnum,
} from 'src/generated/prisma/client';

export function getAllNominationSessionReportRules(): Prisma.ReportRuleCreateManyReportInput[] {
  return (
    [
      ...Object.values(NominationFile.ManagementRule).map(
        (ruleName) => ['management', ruleName] as const,
      ),
      ...Object.values(NominationFile.StatutoryRule).map(
        (ruleName) => ['statutory', ruleName] as const,
      ),
      ...Object.values(NominationFile.QualitativeRule).map(
        (ruleName) => ['qualitative', ruleName] as const,
      ),
    ] as const satisfies (readonly [PrismaRuleGroupEnum, PrismaRuleNameEnum])[]
  ).map(
    ([ruleGroup, ruleName]) =>
      ({
        ruleGroup,
        ruleName,
        validated: false,
      }) satisfies Prisma.ReportRuleCreateManyReportInput,
  );
}
