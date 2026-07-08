const parisWallClockFormat = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export function toParisWallClock(instant: Date): Date {
  const parts = new Map(parisWallClockFormat.formatToParts(instant).map(({ type, value }) => [type, value]));
  const at = (type: Intl.DateTimeFormatPartTypes) => Number(parts.get(type));

  return new Date(Date.UTC(at('year'), at('month') - 1, at('day'), at('hour'), at('minute'), at('second')));
}
