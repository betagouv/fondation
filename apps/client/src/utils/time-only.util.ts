import z from 'zod';

import type { PlainDateOnly } from './date-only.util';

export type PlainTimeOnly = { hours: number; minutes: number; seconds: number };

export function toScheduledDate(date: PlainDateOnly | null, time: PlainTimeOnly | null): Date | null {
  if (!date || !time) return null;
  return new Date(date.year, date.month - 1, date.day, time.hours, time.minutes, time.seconds);
}

export function isPastSchedule(
  date: PlainDateOnly | null,
  time: PlainTimeOnly | null,
  now = new Date(),
): boolean {
  const scheduledAt = toScheduledDate(date, time);
  return scheduledAt !== null && scheduledAt.getTime() < now.getTime();
}

export const formTimeOnlyCodec = z.codec(
  z.string().regex(/\d\d:\d\d(?::\d\d)?/, `Format incorrect. Heure au format HH:MM attendue`),
  z.object({
    hours: z.number().int().gte(0).lte(23),
    minutes: z.number().int().gte(0).lte(59),
    seconds: z.number().int().gte(0).lte(59).default(0),
  }),
  {
    encode(timeOnly, ctx) {
      const value = timeOnlyToString(timeOnly, 'HH:mm');
      if (!value) {
        ctx.issues.push({ code: 'custom', input: timeOnly, continue: false, message: `heure invalide` });
        return z.NEVER;
      }

      return value;
    },

    decode(str, ctx) {
      const [hours, minutes, seconds = 0] = str.split(':').map(Number);
      const value = timeOnlyToDate({ hours, minutes, seconds });
      if (!value) {
        ctx.issues.push({ code: 'custom', input: str, continue: false, message: `heure invalide` });
        return z.NEVER;
      }

      return { hours, minutes, seconds };
    },
  },
);

export function timeOnlyToDate(timeOnly: { hours: number; minutes: number; seconds?: number }): Date | null {
  const { hours, minutes, seconds = 0 } = timeOnly;
  const date = new Date(2026, 0, 10, hours, minutes, seconds);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function dateToTimeOnly(date: Date): PlainTimeOnly | null {
  if (!Number.isFinite(date.getTime())) return null;

  const [hours, minutes, seconds] = [date.getHours(), date.getMinutes(), date.getSeconds()];
  return { hours, minutes, seconds };
}

export function timeOnlyToString(
  timeOnly: { hours: number; minutes: number; seconds?: number },
  format: 'HH:mm' | 'HH:mm:ss',
): string | null {
  const date = timeOnlyToDate({ seconds: 0, ...timeOnly });
  if (date === null) return null;

  let parts: number[] = [];
  if (format.endsWith('mm')) {
    const { hours, minutes } = timeOnly;
    parts = [hours, minutes];
  } else {
    const { hours, minutes, seconds = 0 } = timeOnly;
    parts = [hours, minutes, seconds];
  }

  return parts.map((x) => x.toString().padStart(2, '0')).join(':');
}
