import { differenceInMonths, differenceInYears, formatDuration } from 'date-fns';
import { fr as dateLocaleFr } from 'date-fns/locale/fr';
import React from 'react';
import { useIntl } from 'react-intl';

import type { DateOnlyJson } from 'shared-models';

import { DateOnly } from '@/models/date-only.model';

function asDate(value: Date | DateOnly | DateOnlyJson): Date {
  return value instanceof DateOnly
    ? value.toDate()
    : value instanceof Date
      ? value
      : DateOnly.fromStoreModel(value).toDate();
}

export function useIntlAge() {
  return React.useCallback((birthDate: Date | DateOnly | DateOnlyJson | null | undefined) => {
    if (birthDate === null || birthDate === undefined) return null;

    const now = new Date();
    const years = differenceInYears(now, asDate(birthDate));

    return formatDuration({ years }, { locale: dateLocaleFr });
  }, []);
}

export function useIntlBirthDate() {
  const { $t } = useIntl();
  const formatAge = useIntlAge();

  return React.useCallback(
    (birthDate: Date | DateOnly | DateOnlyJson | null | undefined) => {
      if (birthDate === null || birthDate === undefined) return null;
      const age = formatAge(birthDate);
      if (age === null) return null;

      return $t(
        { defaultMessage: `{birthDate, date, dateOnlyShort} ({age})` },
        { birthDate: asDate(birthDate), age },
      );
    },
    [$t, formatAge],
  );
}

export function useIntlPositionDuration() {
  const { $t } = useIntl();
  const delimiter = $t({ defaultMessage: ' et ' });

  return React.useCallback(
    (startDate: Date | DateOnly | DateOnlyJson | null | undefined) => {
      if (startDate === null || startDate === undefined) return null;

      const now = new Date();
      const earlierDate = asDate(startDate);
      const difference = differenceInMonths(now, earlierDate);

      const years = Math.floor(difference / 12);
      const months = difference - years * 12;

      return formatDuration({ months, years }, { locale: dateLocaleFr, delimiter });
    },
    [delimiter],
  );
}
