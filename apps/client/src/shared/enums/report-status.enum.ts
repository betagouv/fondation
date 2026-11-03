import { defineMessages } from 'react-intl';

import type { DetailedReportDto, UpdateReportDto } from '@api/types';

export type ReportStatusEnum = NonNullable<UpdateReportDto['status']>;
export type MemberReportStatusEnum = DetailedReportDto['state'];

export const REPORT_STATUSES = [
  'NEW',
  'IN_PROGRESS',
  'READY_TO_SUPPORT',
  'SUPPORTED',
] as const satisfies ReportStatusEnum[];

export const ReportStatusEnumMessages = defineMessages({
  IN_PROGRESS: { defaultMessage: 'En cours' },
  NEW: { defaultMessage: 'Nouveau' },
  NOT_APPLICABLE: { defaultMessage: 'Sans objet' },
  READY_TO_SUPPORT: { defaultMessage: 'Prêt à soutenir' },
  SUPPORTED: { defaultMessage: 'Soutenu' },
} satisfies Record<MemberReportStatusEnum, { defaultMessage: string }>);
