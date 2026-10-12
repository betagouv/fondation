import { defineMessages } from 'react-intl';

import type { AffectReportersDto } from '@api/types';

export type PrioriteEnum = NonNullable<AffectReportersDto['items'][number]['priorities']>[number];

export const PrioriteEnum = {
  ETOILE: 'ETOILE',
  OUTRE_MER: 'OUTRE_MER',
  PROFILE: 'PROFILE',
} as const satisfies Record<PrioriteEnum, PrioriteEnum>;

export const PrioriteEnumMessages = defineMessages({
  ETOILE: { defaultMessage: 'Étoilé' },
  OUTRE_MER: { defaultMessage: 'Outre-mer' },
  PROFILE: { defaultMessage: 'Profilé' },
} satisfies Record<PrioriteEnum, { defaultMessage: string }>);
