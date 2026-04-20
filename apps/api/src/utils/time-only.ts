import z from 'zod';

export const timeOnlySchema = z.object({
  hours: z.number().int().gte(1).lte(23),
  minutes: z.number().int().gte(0).lte(59).default(0),
  seconds: z.number().int().gte(0).lte(59).default(0),
});

export type TimeOnly = z.infer<typeof timeOnlySchema>;

export function timeOnlyToDate(time: TimeOnly): Date {
  return new Date(
    Date.UTC(2026, 0, 10, time.hours, time.minutes, time.seconds, 0),
  );
}

export function dateToTimeOnly(date: Date): TimeOnly {
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();

  return { hours, minutes, seconds };
}
