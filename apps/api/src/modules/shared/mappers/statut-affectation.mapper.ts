import { PrismaStatutAffectationEnum } from 'src/generated/prisma/enums';
import { StatutAffectation } from 'src/nominations-context/sessions/business-logic/models/affectation';
import { assertNever } from 'src/utils/assert-never';

export function prismaStatutAffectationEnumToStatutAffectationEnum(
  value: PrismaStatutAffectationEnum,
): StatutAffectation {
  switch (value) {
    case 'BROUILLON':
      return StatutAffectation.BROUILLON;
    case 'PUBLIEE':
      return StatutAffectation.PUBLIEE;
    default:
      return assertNever(value);
  }
}

export function statutAffectationEnumToPrismaStatutAffectationEnum(
  value: StatutAffectation,
): PrismaStatutAffectationEnum {
  switch (value) {
    case StatutAffectation.BROUILLON:
      return 'BROUILLON';
    case StatutAffectation.PUBLIEE:
      return 'PUBLIEE';
    default:
      return assertNever(value);
  }
}
