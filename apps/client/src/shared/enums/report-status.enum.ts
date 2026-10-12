import { defineMessages } from 'react-intl';

import type { DetailedReportDto } from '@api/types';

export type ReportStatusEnum = NonNullable<DetailedReportDto['state']>;

export const REPORT_STATUSES = [
  'NEW',
  'IN_PROGRESS',
  'READY_TO_SUPPORT',
  'SUPPORTED',
] as const satisfies ReportStatusEnum[];

export const ReportStatusEnumMessages = defineMessages({
  IN_PROGRESS: { defaultMessage: 'En cours' },
  NEW: { defaultMessage: 'Nouveau' },
  READY_TO_SUPPORT: { defaultMessage: 'Prêt à soutenir' },
  SUPPORTED: { defaultMessage: 'Soutenu' },
} satisfies Record<ReportStatusEnum, { defaultMessage: string }>);
