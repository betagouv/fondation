import { PrismaStatutAffectationEnum } from '../../../generated/prisma/enums';
import { assertNever } from '../../../utils/assert-never';
import { StatutAffectationEnum } from '../statut-affectation.enum';

export function prismaStatutAffectationEnumToStatutAffectationEnum(
  value: PrismaStatutAffectationEnum,
): StatutAffectationEnum {
  switch (value) {
    case 'BROUILLON':
      return 'BROUILLON';
    case 'PUBLIEE':
      return 'PUBLIEE';
    default:
      return assertNever(value);
  }
}

export function statutAffectationEnumToPrismaStatutAffectationEnum(
  value: StatutAffectationEnum,
): PrismaStatutAffectationEnum {
  switch (value) {
    case 'BROUILLON':
      return 'BROUILLON';
    case 'PUBLIEE':
      return 'PUBLIEE';
    default:
      return assertNever(value);
  }
}
