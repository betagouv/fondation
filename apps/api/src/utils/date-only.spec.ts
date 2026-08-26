import { DateOnly } from './date-only';
import { FRENCH_TIME_ZONES } from './french-time-zones';

const systemTimeZone = process.env.TZ;
afterEach(() => {
  process.env.TZ = systemTimeZone;
});

function inTimeZone<T>(timeZone: string, read: () => T): T {
  process.env.TZ = timeZone;
  return read();
}

describe('DateOnly', () => {
  it.each(FRENCH_TIME_ZONES)('serializes the day it was built with, from %s', (timeZone) => {
    const json = inTimeZone(timeZone, () => new DateOnly(2026, 6, 1).toJson());

    expect(json).toEqual({ year: 2026, month: 6, day: 1 });
  });

  it('round-trips through json', () => {
    const dateOnly = new DateOnly(2026, 12, 31);

    expect(DateOnly.fromJson(dateOnly.toJson()).equals(dateOnly)).toBe(true);
  });

  it('reads the day a formatted string carries', () => {
    expect(DateOnly.fromString('01/06/2026').toJson()).toEqual({ year: 2026, month: 6, day: 1 });
    expect(DateOnly.fromString('2026-06-01', 'yyyy-MM-dd').toJson()).toEqual({
      year: 2026,
      month: 6,
      day: 1,
    });
  });

  describe('fromUtcDate', () => {
    it.each(FRENCH_TIME_ZONES)('reads the day a date column holds, from %s', (timeZone) => {
      const stored = new Date(Date.UTC(2026, 5, 1));

      expect(inTimeZone(timeZone, () => DateOnly.fromUtcDate(stored).toJson())).toEqual({
        year: 2026,
        month: 6,
        day: 1,
      });
    });
  });

  // Intl.DateTimeFormat freezes its zone when it is constructed and ours is built once when the
  // module loads: only reloading it under the server's zone proves anything here.
  describe('fromInstantInParis', () => {
    it.each(FRENCH_TIME_ZONES)('truncates a summer instant on its Paris day, from %s', async (timeZone) => {
      vi.resetModules();
      process.env.TZ = timeZone;
      const { DateOnly: reloaded } = await import('./date-only');

      // 00:30 on June 2nd in Paris (UTC+2), still June 1st in UTC
      const instant = new Date('2026-06-01T22:30:00.000Z');

      expect(reloaded.fromInstantInParis(instant).toJson()).toEqual({
        year: 2026,
        month: 6,
        day: 2,
      });
    });

    it.each(FRENCH_TIME_ZONES)('truncates a winter instant on its Paris day, from %s', async (timeZone) => {
      vi.resetModules();
      process.env.TZ = timeZone;
      const { DateOnly: reloaded } = await import('./date-only');

      // 00:30 on January 2nd in Paris (UTC+1), still January 1st in UTC
      const instant = new Date('2026-01-01T23:30:00.000Z');

      expect(reloaded.fromInstantInParis(instant).toJson()).toEqual({
        year: 2026,
        month: 1,
        day: 2,
      });
    });
  });

  describe('plusDays', () => {
    it.each(FRENCH_TIME_ZONES)('lands a week later on the calendar, from %s', (timeZone) => {
      // A week from March 25th 2026 crosses the European DST switch
      const closing = inTimeZone(timeZone, () => new DateOnly(2026, 3, 25).plusDays(7));

      expect(closing.toJson()).toEqual({ year: 2026, month: 4, day: 1 });
    });

    it('rolls over month and year ends', () => {
      expect(new DateOnly(2026, 12, 28).plusDays(7).toJson()).toEqual({ year: 2027, month: 1, day: 4 });
      expect(new DateOnly(2024, 2, 26).plusDays(7).toJson()).toEqual({ year: 2024, month: 3, day: 4 });
    });
  });

  describe('toLocalStartOfDay', () => {
    it.each(FRENCH_TIME_ZONES)('opens the day where the code runs, in %s', (timeZone) => {
      const startOfDay = inTimeZone(timeZone, () => new DateOnly(2026, 6, 1).toLocalStartOfDay());

      expect([startOfDay.getFullYear(), startOfDay.getMonth() + 1, startOfDay.getDate()]).toEqual([
        2026, 6, 1,
      ]);
      expect(startOfDay.getHours()).toBe(0);
    });
  });
});
