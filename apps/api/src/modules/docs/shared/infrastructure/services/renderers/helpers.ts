import { UserTitleEnum } from 'src/modules/administration/domain/user-enum';
import { GenderEnum } from 'src/modules/shared/gender.enum';
import { capitalize } from 'src/utils/capitalize';
import { DateOnlyJson } from 'src/utils/date-only';
import { DateOnly } from 'src/utils/date-only';
import { unaccent } from 'src/utils/unaccent';

export function fullname(props: { firstName: string; lastName: string }): string {
  return `${capitalize(props.firstName)}\u00A0${props.lastName.toUpperCase()}`;
}

export function titled(props: {
  title: UserTitleEnum | null;
  firstName: string;
  lastName: string;
  gender: GenderEnum;
}): string {
  if (!props.title || props.title === 'FIRST_SECRETARY') return fullname(props);

  if (props.title === 'PRESIDENT_PARQUET' || props.title === 'PRESIDENT_SIEGE') {
    return props.gender === GenderEnum.MALE
      ? `Le président, ${fullname(props)}`
      : `La présidente, ${fullname(props)}`;
  }

  return props.gender === GenderEnum.MALE
    ? `Le président suppléant, ${fullname(props)}`
    : `La présidente suppléante, ${fullname(props)}`;
}

export function displayTitled(props: {
  firstName: string;
  lastName: string;
  displayTitle: string | null;
  gender: GenderEnum;
}): string {
  const title = props.displayTitle?.trim() || null;
  const output = props.gender === GenderEnum.MALE ? `M. ${fullname(props)}` : `Mme ${fullname(props)}`;

  if (!title) return output;
  return `${output}, ${title[0]!.toLowerCase() + title.slice(1)}`;
}

const shortDate = new Intl.DateTimeFormat('fr', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
  year: 'numeric',
});

const longDate = new Intl.DateTimeFormat('fr', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
  year: 'numeric',
});

type DateFormat = 'dd/MM/yyyy' | 'do MMMM yyyy';
export function date(date: DateOnly | DateOnlyJson, format: DateFormat = 'dd/MM/yyyy'): string {
  const dateOnly = date instanceof DateOnly ? date : DateOnly.fromJson(date);
  if (format === 'dd/MM/yyyy') return shortDate.format(dateOnly.toDate());

  // In French only the first of the month takes an ordinal
  const formatted = longDate.format(dateOnly.toDate());
  return dateOnly.toJson().day === 1 ? formatted.replace(/^1 /, `1<sup>er</sup> `) : formatted;
}

const elidingInitials = new Set(['a', 'e', 'i', 'o', 'u', 'y', 'h']);
export function requiresElision(word: string): boolean {
  const first = unaccent(word).trim()[0]?.toLowerCase();
  return !!first && elidingInitials.has(first);
}

const conjunctionListFormatter = new Intl.ListFormat('fr', {
  type: 'conjunction',
});
export function conjunctionList<T extends string | { toString(): string }>(items: readonly T[]) {
  return conjunctionListFormatter.format(items.map((x) => String(x)));
}
