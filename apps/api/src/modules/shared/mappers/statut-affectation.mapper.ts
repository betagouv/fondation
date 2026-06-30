import { PrismaStatutAffectationEnum } from 'src/generated/prisma/enums';
import { StatutAffectationEnum } from 'src/modules/session/shared/types/statut-affectation.enum';
import { assertNever } from 'src/utils/assert-never';

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
