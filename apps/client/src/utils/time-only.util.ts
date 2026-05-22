import z from 'zod';

export const formTimeOnlyCodec = z.codec(
  z.string().regex(/\d\d:\d\d(?::\d\d)?/, `Format incorrect. Heure au format HH:MM attendue`),
  z.object({
    hours: z.number().int().gte(0).lte(23).default(0).optional(),
    minutes: z.number().int().gte(0).lte(59).default(0).optional(),
    seconds: z.number().int().gte(0).lte(59).default(0).optional(),
  }),
  {
    encode(timeOnly, ctx) {
      const value = timeOnlyToString({ hours: 0, minutes: 0, seconds: 0, ...timeOnly }, 'HH:mm');
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

export type TimeOnly = z.infer<typeof formTimeOnlyCodec>;

export function timeOnlyToDate(timeOnly: TimeOnly): Date | null {
  const { hours, minutes, seconds } = timeOnly;
  if (hours === undefined && minutes === undefined && seconds === undefined) return null;

  const date = new Date(2026, 0, 10, hours ?? 0, minutes ?? 0, seconds ?? 0);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function dateToTimeOnly(date: Date): { hours: number; minutes: number; seconds: number } | null {
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
