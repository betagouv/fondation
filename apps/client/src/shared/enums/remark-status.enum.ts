import { defineMessages } from 'react-intl';

import type { ChangeRemarkStatusDto } from '@api/types';

export type RemarkStatusEnum = ChangeRemarkStatusDto['status'];

// in the order of the status list
export const REMARK_STATUSES = [
  'NEW',
  'PROCESSED',
  'DISMISSED',
] as const satisfies readonly RemarkStatusEnum[];

export const RemarkStatusEnumMessages = defineMessages({
  DISMISSED: { defaultMessage: 'Écarté' },
  NEW: { defaultMessage: 'Nouveau' },
  PROCESSED: { defaultMessage: 'Traité' },
} satisfies Record<RemarkStatusEnum, { defaultMessage: string }>);
