import { defineMessages } from 'react-intl';

import type { DetailedJobDto } from '@api/types';

export type JobStatusEnum = DetailedJobDto['status'];

export const JobStatusEnum = {
  CANCELED: 'CANCELED',
  FAILED: 'FAILED',
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  SUCCEEDED: 'SUCCEEDED',
} as const satisfies Record<JobStatusEnum, JobStatusEnum>;

export const JobStatusEnumMessages = defineMessages({
  CANCELED: { defaultMessage: 'annulé' },
  FAILED: { defaultMessage: 'échec' },
  IDLE: { defaultMessage: 'en attente' },
  RUNNING: { defaultMessage: 'en cours' },
  SUCCEEDED: { defaultMessage: 'succès' },
} satisfies Record<JobStatusEnum, { defaultMessage: string }>);
