import { defineMessages } from 'react-intl';

import type { ChangeFeedbackStatusDto } from '@api/types';

export type FeedbackStatusEnum = ChangeFeedbackStatusDto['status'];

// in the order of the status list
export const FEEDBACK_STATUSES = [
  'NEW',
  'ACKNOWLEDGED',
  'PROCESSED',
  'DISMISSED',
] as const satisfies readonly FeedbackStatusEnum[];

export const FeedbackStatusEnumMessages = defineMessages({
  ACKNOWLEDGED: { defaultMessage: 'Pris en compte' },
  DISMISSED: { defaultMessage: 'Écarté' },
  NEW: { defaultMessage: 'Nouveau' },
  PROCESSED: { defaultMessage: 'Traité' },
} satisfies Record<FeedbackStatusEnum, { defaultMessage: string }>);
