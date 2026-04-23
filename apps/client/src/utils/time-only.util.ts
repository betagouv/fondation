export function timeOnlyToDate(timeOnly: { hours: number; minutes: number; seconds: number }): Date | null {
  const date = new Date(2026, 0, 10, timeOnly.hours ?? 0, timeOnly.minutes ?? 0, timeOnly?.seconds ?? 0);

  return Number.isFinite(date.getTime()) ? date : null;
}
