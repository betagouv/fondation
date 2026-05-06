import { formatDate } from 'date-fns';
import { fr as dateLocaleFr } from 'date-fns/locale/fr';

import { DateOnlyJson, Gender } from 'shared-models';

import { UserTitleEnum } from 'src/modules/administration/domain/user-enum';
import { capitalize } from 'src/utils/capitalize';
import { DateOnly } from 'src/utils/date-only';

export function fullname(props: { firstName: string; lastName: string }): string {
  return `${capitalize(props.firstName)}\u00A0${props.lastName.toUpperCase()}`;
}

export function titled(props: {
  title: UserTitleEnum | null;
  firstName: string;
  lastName: string;
  gender: Gender;
}): string {
  if (!props.title || props.title === 'FIRST_SECRETARY') return fullname(props);

  if (props.title === 'PRESIDENT_PARQUET' || props.title === 'PRESIDENT_SIEGE') {
    return props.gender === Gender.M
      ? `Le président, ${fullname(props)}`
      : `La présidente, ${fullname(props)}`;
  }

  return props.gender === Gender.M
    ? `Le président suppléant, ${fullname(props)}`
    : `La présidente suppléante, ${fullname(props)}`;
}

export function displayTitled(props: {
  firstName: string;
  lastName: string;
  displayTitle: string | null;
  gender: Gender;
}): string {
  const title = props.displayTitle?.trim() || null;
  const output = props.gender === Gender.M ? `M. ${fullname(props)}` : `Mme ${fullname(props)}`;

  if (!title) return output;
  return `${output}, ${title[0]!.toLowerCase() + title.slice(1)}`;
}

type DateFormat = 'dd/MM/yyyy' | 'do MMMM yyyy';
export function date(date: Date | DateOnly | DateOnlyJson, format: DateFormat = 'dd/MM/yyyy'): string {
  const d =
    date instanceof Date ? date : date instanceof DateOnly ? date.toDate() : DateOnly.fromJson(date).toDate();

  const formatted = formatDate(d, format, { locale: dateLocaleFr });

  if (formatted.match(/1er/)) return formatted.replace(/^1er/, `1<sup>er</sup>`);

  return formatted;
}

const conjunctionListFormatter = new Intl.ListFormat('fr', {
  type: 'conjunction',
});
export function conjunctionList<T extends string | { toString(): string }>(items: readonly T[]) {
  return conjunctionListFormatter.format(items.map((x) => String(x)));
}
