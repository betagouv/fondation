import { defineMessages } from 'react-intl';

import type { FollowUpOnObservationDto } from '@api/types';

export type ObservationFollowUpEnum = NonNullable<FollowUpOnObservationDto['followUp']>;

export const ObservationFollowUpEnum = {
  ALERT: 'ALERT',
  INTERESTING: 'INTERESTING',
  REFERENCE: 'REFERENCE',
} as const satisfies Record<ObservationFollowUpEnum, ObservationFollowUpEnum>;

export const ObservationFollowUpEnumMessages = defineMessages({
  ALERT: { defaultMessage: 'Signalement' },
  INTERESTING: { defaultMessage: `Digne d'intérêt` },
  REFERENCE: { defaultMessage: 'Recommandation' },
} satisfies Record<ObservationFollowUpEnum, { defaultMessage: string }>);
