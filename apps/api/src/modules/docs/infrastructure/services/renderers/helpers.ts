import { formatDate } from 'date-fns';
import { fr as dateLocaleFr } from 'date-fns/locale/fr';
import { DateOnlyJson } from 'shared-models';
import { capitalize } from 'src/utils/capitalize';
import { DateOnly } from 'src/utils/date-only';

export function fullname(props: {
  firstName: string;
  lastName: string;
}): string {
  return `${capitalize(props.firstName)}\u00A0${props.lastName.toUpperCase()}`;
}

type DateFormat = 'dd/MM/yyyy' | 'do MMMM yyyy';
export function date(
  date: Date | DateOnly | DateOnlyJson,
  format: DateFormat = 'dd/MM/yyyy',
): string {
  const d =
    date instanceof Date
      ? date
      : date instanceof DateOnly
        ? date.toDate()
        : DateOnly.fromJson(date).toDate();

  const formatted = formatDate(d, format, { locale: dateLocaleFr });

  if (formatted.match(/1er/))
    return formatted.replace(/^1er/, `1<sup>er</sup>`);

  return formatted;
}

const conjunctionListFormatter = new Intl.ListFormat('fr', {
  type: 'conjunction',
});
export function conjuctionList<T extends string | { toString(): string }>(
  items: readonly T[],
) {
  return conjunctionListFormatter.format(items.map((x) => `${x}`));
}
