import { defineMessages } from 'react-intl';

import type { DetailedJobDto } from '@api/types';

export type SeverityEnum = DetailedJobDto['errors'][number]['severity'];

export const SeverityEnum = {
  ERROR: 'ERROR',
  WARNING: 'WARNING',
} as const satisfies Record<SeverityEnum, SeverityEnum>;

export const SeverityEnumCountMessages = defineMessages({
  ERROR: { defaultMessage: '{count, plural, one {# erreur} other {# erreurs}}' },
  WARNING: { defaultMessage: '{count, plural, one {# avertissement} other {# avertissements}}' },
} satisfies Record<SeverityEnum, { defaultMessage: string }>);
