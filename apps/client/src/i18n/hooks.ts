import { differenceInMonths, differenceInYears, formatDuration } from 'date-fns';
import { fr as dateLocaleFr } from 'date-fns/locale/fr';
import { createElement, useCallback, type ReactNode } from 'react';
import { useIntl } from 'react-intl';

import { dateOnlyToLocalStartOfDay, formatDateOnly, type PlainDateOnly } from '@/utils/date-only.util';

export function useIntlAge() {
  return useCallback((birthDate: PlainDateOnly | null | undefined) => {
    if (birthDate === null || birthDate === undefined) return null;

    const now = new Date();
    const years = differenceInYears(now, dateOnlyToLocalStartOfDay(birthDate));

    return formatDuration({ years }, { locale: dateLocaleFr });
  }, []);
}

export function useIntlBirthDate() {
  const { $t } = useIntl();
  const formatAge = useIntlAge();

  return useCallback(
    (birthDate: PlainDateOnly | null | undefined) => {
      if (birthDate === null || birthDate === undefined) return null;
      const age = formatAge(birthDate);
      if (age === null) return null;

      return $t(
        { defaultMessage: `{birthDate} (<bold>{age}</bold>)` },
        {
          birthDate: formatDateOnly(birthDate),
          age,
          bold: (chunks: ReactNode[]): ReactNode =>
            createElement('strong', { className: 'fr-text--bold' }, chunks),
        },
      );
    },
    [$t, formatAge],
  );
}

export function useIntlPositionDuration() {
  const { formatMessage } = useIntl();
  const delimiter = ` ${formatMessage({ defaultMessage: 'et' })} `;

  return useCallback(
    (startDate: PlainDateOnly | null | undefined) => {
      if (startDate === null || startDate === undefined) return null;

      const now = new Date();
      const difference = differenceInMonths(now, dateOnlyToLocalStartOfDay(startDate));

      const years = Math.floor(difference / 12);
      const months = difference - years * 12;

      return formatDuration({ months, years }, { locale: dateLocaleFr, delimiter });
    },
    [delimiter],
  );
}
