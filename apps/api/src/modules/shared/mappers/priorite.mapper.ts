import { PrioriteEnum } from 'shared-models';
import { PrismaPrioriteEnum } from 'src/generated/prisma/enums';
import { assertNever } from 'src/utils/assert-never';

export function prismaPrioriteEnumToPrioriteEnum(
  value: PrismaPrioriteEnum,
): PrioriteEnum {
  switch (value) {
    case 'ETOILE':
      return PrioriteEnum.ETOILE;
    case 'OUTRE_MER':
      return PrioriteEnum.OUTRE_MER;
    case 'PROFILE':
      return PrioriteEnum.PROFILE;
    default:
      return assertNever(value);
  }
}

export function prioriteEnumToPrismaPrioriteEnum(
  value: PrioriteEnum,
): PrismaPrioriteEnum {
  switch (value) {
    case PrioriteEnum.ETOILE:
      return 'ETOILE';
    case PrioriteEnum.OUTRE_MER:
      return 'OUTRE_MER';
    case PrioriteEnum.PROFILE:
      return 'PROFILE';
    default:
      return assertNever(value);
  }
}

export const PrioriteEnumLabels: Record<PrioriteEnum, string> = {
  ETOILE: 'Étoilé',
  OUTRE_MER: 'Outre-mer',
  PROFILE: 'Profilé',
};
