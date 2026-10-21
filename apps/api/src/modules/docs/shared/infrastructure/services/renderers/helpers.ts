import { GenderEnum } from 'src/modules/shared/gender.enum';
import { UserTitleEnum } from 'src/modules/shared/user-title.enum';
import { DateOnlyJson } from 'src/utils/date-only';
import { DateOnly } from 'src/utils/date-only';
import { unaccent } from 'src/utils/unaccent';
import { fullname } from 'src/utils/user.util';

import { SafeHtml } from './safe-html';

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
export function date(date: DateOnly | DateOnlyJson, format: DateFormat = 'dd/MM/yyyy'): SafeHtml {
  const dateOnly = date instanceof DateOnly ? date : DateOnly.fromJson(date);
  if (format === 'dd/MM/yyyy') return new SafeHtml(shortDate.format(dateOnly.toDate()));

  // In French only the first of the month takes an ordinal
  const formatted = longDate.format(dateOnly.toDate());
  return new SafeHtml(dateOnly.toJson().day === 1 ? formatted.replace(/^1 /, `1<sup>er</sup> `) : formatted);
}

const elidingInitials = new Set(['a', 'e', 'i', 'o', 'u', 'y', 'h']);
export function requiresElision(word: string): boolean {
  const first = unaccent(word).trim()[0]?.toLowerCase();
  return !!first && elidingInitials.has(first);
}

/**
 * the template and the editor write the same sentence differently, so the editor's own paragraph
 * wrappers, its spacing and the quotes the template escapes but the editor leaves as is are set
 * aside. The emphasis is not: putting a name in bold is an edition of its own.
 */
export function readsTheSame(left: string, right: string): boolean {
  const words = (html: string) =>
    html
      .replace(/<\/?(p|div|li|ul|ol|h[1-6]|br)\s*\/?>/gi, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();

  return words(left) === words(right);
}

const conjunctionListFormatter = new Intl.ListFormat('fr', {
  type: 'conjunction',
});
export function conjunctionList<T extends string | { toString(): string }>(items: readonly T[]) {
  return conjunctionListFormatter.format(items.map((x) => String(x)));
}
