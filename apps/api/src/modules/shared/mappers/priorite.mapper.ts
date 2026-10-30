import { PrismaPrioriteEnum } from '../../../generated/prisma/enums';
import { assertNever } from '../../../utils/assert-never';
import { PriorityEnum } from '../priority.enum';

export function prismaPrioriteEnumToPriorityEnum(value: PrismaPrioriteEnum): PriorityEnum {
  switch (value) {
    case 'ETOILE':
      return 'ETOILE';
    case 'OUTRE_MER':
      return 'OUTRE_MER';
    case 'PROFILE':
      return 'PROFILE';
    default:
      return assertNever(value);
  }
}

export function priorityEnumToPrismaPrioriteEnum(value: PriorityEnum): PrismaPrioriteEnum {
  switch (value) {
    case 'ETOILE':
      return 'ETOILE';
    case 'OUTRE_MER':
      return 'OUTRE_MER';
    case 'PROFILE':
      return 'PROFILE';
    default:
      return assertNever(value);
  }
}

export const PriorityEnumLabels: Record<PriorityEnum, string> = {
  ETOILE: 'Étoilé',
  OUTRE_MER: 'Outre-mer',
  PROFILE: 'Profilé',
};
