import { PrismaPrioriteEnum } from 'src/generated/prisma/enums';
import { PriorityEnum } from 'src/modules/shared/priority.enum';
import { assertNever } from 'src/utils/assert-never';

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
