import { defineMessages } from 'react-intl';

import type { UpdateObservationBlockTrackingDto } from '@api/types';

export type ObservationBlockTrackingStatusEnum = UpdateObservationBlockTrackingDto['status'];

export const OBSERVATION_BLOCK_TRACKING_STATUSES = [
  'IN_PROGRESS',
  'DONE',
] as const satisfies readonly ObservationBlockTrackingStatusEnum[];

export const ObservationBlockTrackingStatusEnumMessages = defineMessages({
  DONE: { defaultMessage: 'Terminé' },
  IN_PROGRESS: { defaultMessage: 'En cours' },
} satisfies Record<ObservationBlockTrackingStatusEnum, { defaultMessage: string }>);
