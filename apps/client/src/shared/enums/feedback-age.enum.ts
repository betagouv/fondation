import { defineMessages } from 'react-intl';

import type { ListFeedbacksData } from '@api/types';

export type FeedbackAgeEnum = NonNullable<NonNullable<ListFeedbacksData['query']>['sentAgo']>;

// in the order of the filter
export const FEEDBACK_AGES = [
  'MORE_THAN_7_DAYS',
  'MORE_THAN_14_DAYS',
  'MORE_THAN_21_DAYS',
  'MORE_THAN_1_MONTH',
  'MORE_THAN_2_MONTHS',
] as const satisfies readonly FeedbackAgeEnum[];

export const FeedbackAgeEnumMessages = defineMessages({
  MORE_THAN_14_DAYS: { defaultMessage: 'Plus de 14 jours' },
  MORE_THAN_1_MONTH: { defaultMessage: "Plus d'un mois" },
  MORE_THAN_21_DAYS: { defaultMessage: 'Plus de 21 jours' },
  MORE_THAN_2_MONTHS: { defaultMessage: 'Plus de 2 mois' },
  MORE_THAN_7_DAYS: { defaultMessage: 'Plus de 7 jours' },
} satisfies Record<FeedbackAgeEnum, { defaultMessage: string }>);
