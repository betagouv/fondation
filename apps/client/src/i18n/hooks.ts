import { differenceInMonths, differenceInYears, formatDuration } from 'date-fns';
import { fr as dateLocaleFr } from 'date-fns/locale/fr';
import React from 'react';
import { useIntl } from 'react-intl';

import { dateOnlyToDate, type PlainDateOnly } from '@/utils/date-only.util';

export function useIntlAge() {
  return React.useCallback((birthDate: Date | PlainDateOnly | null | undefined) => {
    if (birthDate === null || birthDate === undefined) return null;

    const now = new Date();
    const years = differenceInYears(now, birthDate instanceof Date ? birthDate : dateOnlyToDate(birthDate));

    return formatDuration({ years }, { locale: dateLocaleFr });
  }, []);
}

export function useIntlBirthDate() {
  const { $t } = useIntl();
  const formatAge = useIntlAge();

  return React.useCallback(
    (birthDate: Date | PlainDateOnly | null | undefined) => {
      if (birthDate === null || birthDate === undefined) return null;
      const age = formatAge(birthDate);
      if (age === null) return null;

      return $t(
        { defaultMessage: `{birthDate, date, dateOnlyShort} (<bold>{age}</bold>)` },
        {
          birthDate: birthDate instanceof Date ? birthDate : dateOnlyToDate(birthDate),
          age,
          bold: (chunks: React.ReactNode[]): React.ReactNode =>
            React.createElement('strong', { className: 'fr-text--bold' }, chunks),
        },
      );
    },
    [$t, formatAge],
  );
}

export function useIntlPositionDuration() {
  const { formatMessage } = useIntl();
  const delimiter = ` ${formatMessage({ defaultMessage: 'et' })} `;

  return React.useCallback(
    (startDate: Date | PlainDateOnly | null | undefined) => {
      if (startDate === null || startDate === undefined) return null;

      const now = new Date();
      const earlierDate = startDate instanceof Date ? startDate : dateOnlyToDate(startDate);
      const difference = differenceInMonths(now, earlierDate);

      const years = Math.floor(difference / 12);
      const months = difference - years * 12;

      return formatDuration({ months, years }, { locale: dateLocaleFr, delimiter });
    },
    [delimiter],
  );
}
