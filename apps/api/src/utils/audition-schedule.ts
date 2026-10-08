import z from 'zod';

import { DateOnly, dateOnlyJsonSchema } from './date-only';
import { dateToTimeOnly, timeOnlySchema } from './time-only';

export const auditionScheduleSchema = z.object({ date: dateOnlyJsonSchema, time: timeOnlySchema });

export type AuditionSchedule = z.infer<typeof auditionScheduleSchema>;

export const scheduleAuditionSchema = z
  .object({
    auditionDate: dateOnlyJsonSchema.nullable(),
    auditionTime: timeOnlySchema.nullable(),
  })
  .refine(({ auditionDate, auditionTime }) => (auditionDate === null) === (auditionTime === null), {
    error: "La date et l'heure d'audition doivent être renseignées ensemble",
  });

export function toAuditionSchedule(date: Date, time: Date): AuditionSchedule {
  return { date: DateOnly.fromUtcDate(date).toJson(), time: dateToTimeOnly(time) };
}

export function toOptionalAuditionSchedule(date: Date | null, time: Date | null): AuditionSchedule | null {
  return date && time ? toAuditionSchedule(date, time) : null;
}

const parisClock = new Intl.DateTimeFormat('fr', {
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
  minute: '2-digit',
  month: '2-digit',
  timeZone: 'Europe/Paris',
  year: 'numeric',
});

export function auditionScheduleKey(schedule: AuditionSchedule): string {
  const { date, time } = schedule;
  return [date.year, date.month, date.day, time.hours, time.minutes]
    .map((part) => String(part).padStart(2, '0'))
    .join('');
}

// auditions are scheduled in Paris time while the server runs in UTC
export function isPastAudition(schedule: AuditionSchedule, now: Date): boolean {
  const parts = Object.fromEntries(parisClock.formatToParts(now).map(({ type, value }) => [type, value]));
  return (
    auditionScheduleKey(schedule) < `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}`
  );
}
