import { defineMessages } from 'react-intl';

import type { DetailedReportDto } from '@api/types';

export type FormationEnum = NonNullable<DetailedReportDto['formation']>;

export const FormationEnum = {
  PARQUET: 'PARQUET',
  SIEGE: 'SIEGE',
} as const satisfies Record<FormationEnum, FormationEnum>;

export const FormationEnumMessages = defineMessages({
  PARQUET: { defaultMessage: 'parquet' },
  SIEGE: { defaultMessage: 'siège' },
} satisfies Record<FormationEnum, { defaultMessage: string }>);
