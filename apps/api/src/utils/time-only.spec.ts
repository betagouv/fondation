import { FRENCH_TIME_ZONES } from './french-time-zones';
import { dateToTimeOnly, timeOnlyToDate, timeOnlyToString } from './time-only';

const systemTimeZone = process.env.TZ;
afterEach(() => {
  process.env.TZ = systemTimeZone;
});

function inTimeZone<T>(timeZone: string, read: () => T): T {
  process.env.TZ = timeZone;
  return read();
}

describe('TimeOnly', () => {
  it.each(FRENCH_TIME_ZONES)('prints the hour it was given, from %s', (timeZone) => {
    expect(inTimeZone(timeZone, () => timeOnlyToString({ hours: 9, minutes: 30, seconds: 0 }))).toBe('09:30');
    expect(inTimeZone(timeZone, () => timeOnlyToString({ hours: 14, minutes: 0, seconds: 0 }))).toBe('14:00');
  });

  it('should parse time to a valid date', () => {
    const date = timeOnlyToDate({ hours: 10, minutes: 0, seconds: 0 });

    expect(date.getTime()).not.toBeNaN();
    expect(date.getUTCHours()).toBe(10);
    expect(date.getUTCMinutes()).toBe(0);
    expect(date.getUTCSeconds()).toBe(0);
  });

  it('should parse a date to a time only', () => {
    const date = new Date(Date.UTC(2026, 0, 10, 10));
    const time = dateToTimeOnly(date);

    expect(time).toEqual({ hours: 10, minutes: 0, seconds: 0 });
  });
});
