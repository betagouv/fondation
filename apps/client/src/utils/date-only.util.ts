import { isValid } from 'date-fns';
import z from 'zod';

function assertIsValidDate(date: Date, message?: string): Date {
  if (!isValid(date)) throw new Error(message ?? `Invalid date`);
  return date;
}

export type PlainDateOnly = { day: number; month: number; year: number };

export function dateOnlyToDate(dateOnly: PlainDateOnly): Date;
export function dateOnlyToDate(dateOnly: PlainDateOnly | null | undefined): Date | null | undefined;
export function dateOnlyToDate(dateOnly: PlainDateOnly | null | undefined): Date | null | undefined {
  if (dateOnly === null) return null;
  if (dateOnly === undefined) return undefined;

  if (dateOnly instanceof Date) {
    const [day, month, year] = [dateOnly.getDate(), dateOnly.getMonth() + 1, dateOnly.getFullYear()];
    return dateOnlyToDate({ day, month, year });
  }

  const { day, month, year } = dateOnly;
  return assertIsValidDate(new Date(Date.UTC(year, month - 1, day)));
}

export const dateOnlyCodec = z.codec(
  z.iso.date('Date invalide').pipe(z.coerce.date()),
  z.object({
    day: z.number().int().gte(1).lte(31),
    month: z.number().int().gte(1).lte(12),
    year: z.number().int().gte(1900),
  }),
  {
    encode: (dateOnly) => dateOnlyToDate(dateOnly),
    decode: (d: Date) => ({ day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() }),
  },
);
