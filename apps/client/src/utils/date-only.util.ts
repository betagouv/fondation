import z from 'zod';

export type PlainDateOnly = { day: number; month: number; year: number };

const isoDatePattern = /^(\d{4})-(\d{2})-(\d{2})/;

const dateOnlyFormatter = new Intl.DateTimeFormat('fr', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
  year: 'numeric',
});

export function formatDateOnly(dateOnly: PlainDateOnly): string {
  return dateOnlyFormatter.format(Date.UTC(dateOnly.year, dateOnly.month - 1, dateOnly.day));
}

export function dateOnlyToIso(dateOnly: PlainDateOnly): string;
export function dateOnlyToIso(dateOnly: PlainDateOnly | null | undefined): string | null | undefined;
export function dateOnlyToIso(dateOnly: PlainDateOnly | null | undefined): string | null | undefined {
  if (dateOnly === null) return null;
  if (dateOnly === undefined) return undefined;

  const { day, month, year } = dateOnly;
  return [
    year.toString().padStart(4, '0'),
    month.toString().padStart(2, '0'),
    day.toString().padStart(2, '0'),
  ].join('-');
}

export function dateOnlyFromIso(value: string): PlainDateOnly {
  const parts = isoDatePattern.exec(value);
  if (!parts) throw new Error(`Date invalide: "${value}"`);

  const [, year, month, day] = parts;
  return { day: Number(day), month: Number(month), year: Number(year) };
}

export function compareDateOnly(a: PlainDateOnly, b: PlainDateOnly): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

export function dateOnlyToLocalStartOfDay(dateOnly: PlainDateOnly): Date {
  return new Date(dateOnly.year, dateOnly.month - 1, dateOnly.day);
}

export const dateOnlyCodec = z.codec(
  z.iso.date('Date invalide'),
  z.object({
    day: z.number().int().gte(1).lte(31),
    month: z.number().int().gte(1).lte(12),
    year: z.number().int().gte(1900),
  }),
  {
    encode: (dateOnly) => dateOnlyToIso(dateOnly),
    decode: (value) => dateOnlyFromIso(value),
  },
);
