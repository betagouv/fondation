import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  compareDateOnly,
  dateOnlyCodec,
  dateOnlyFromIso,
  dateOnlyToIso,
  dateOnlyToLocalStartOfDay,
  formatDateOnly,
  formatLongDateOnly,
} from './date-only.util';

const FIRST_OF_JUNE = { day: 1, month: 6, year: 2026 };

// Where our users sit. The footprint spans UTC-10 to UTC+12: the four negative ones read the
// day before on anything anchored to UTC midnight. Marquesas lands on a half hour and Miquelon
// is the only overseas territory observing DST
const FRENCH_TIME_ZONES = [
  'Pacific/Tahiti',
  'Pacific/Marquesas',
  'America/Cayenne',
  'America/Miquelon',
  'Europe/Paris',
  'Indian/Reunion',
  'Pacific/Wallis',
] as const;

const systemTimeZone = process.env.TZ;
afterEach(() => {
  process.env.TZ = systemTimeZone;
});

function inTimeZone<T>(timeZone: string, read: () => T): T {
  process.env.TZ = timeZone;
  return read();
}

describe('formatDateOnly', () => {
  // Intl.DateTimeFormat freezes its zone when it is constructed and ours is built once when the
  // module loads: only reloading it under the reader's zone proves anything here.
  it.each(FRENCH_TIME_ZONES)('reads the same day from %s', async (timeZone) => {
    vi.resetModules();
    process.env.TZ = timeZone;
    const { formatDateOnly: reloaded } = await import('./date-only.util');

    expect(reloaded(FIRST_OF_JUNE)).toBe('01/06/2026');
  });

  it('keeps the day a calendar date carries, not the day its instant falls on', () => {
    expect(formatDateOnly({ day: 31, month: 12, year: 2026 })).toBe('31/12/2026');
    expect(formatDateOnly({ day: 1, month: 1, year: 2027 })).toBe('01/01/2027');
  });
});

describe('formatLongDateOnly', () => {
  it.each(FRENCH_TIME_ZONES)('reads the same day from %s', async (timeZone) => {
    vi.resetModules();
    process.env.TZ = timeZone;
    const { formatLongDateOnly: reloaded } = await import('./date-only.util');

    expect(reloaded(FIRST_OF_JUNE)).toBe('1er juin 2026');
  });

  it('writes the first of the month as an ordinal', () => {
    expect(formatLongDateOnly({ day: 1, month: 4, year: 2026 })).toBe('1er avril 2026');
    expect(formatLongDateOnly({ day: 2, month: 4, year: 2026 })).toBe('2 avril 2026');
    expect(formatLongDateOnly({ day: 21, month: 11, year: 2026 })).toBe('21 novembre 2026');
  });
});

describe('dateOnlyToIso', () => {
  it.each(FRENCH_TIME_ZONES)('fills a date input with the same day from %s', (timeZone) => {
    expect(inTimeZone(timeZone, () => dateOnlyToIso(FIRST_OF_JUNE))).toBe('2026-06-01');
  });

  it('pads every part', () => {
    expect(dateOnlyToIso({ day: 9, month: 3, year: 2026 })).toBe('2026-03-09');
  });

  it('carries null and undefined through', () => {
    expect(dateOnlyToIso(null)).toBeNull();
    expect(dateOnlyToIso(undefined)).toBeUndefined();
  });
});

describe('dateOnlyFromIso', () => {
  it.each(FRENCH_TIME_ZONES)('reads the same day from %s', (timeZone) => {
    expect(inTimeZone(timeZone, () => dateOnlyFromIso('2026-06-01'))).toEqual(FIRST_OF_JUNE);
  });

  it('reads the calendar part of a date serialized as an instant', () => {
    expect(dateOnlyFromIso('2026-06-01T00:00:00.000Z')).toEqual(FIRST_OF_JUNE);
  });

  it('rejects what is not a date', () => {
    expect(() => dateOnlyFromIso('01/06/2026')).toThrow();
  });
});

describe('dateOnlyCodec', () => {
  it.each(FRENCH_TIME_ZONES)('submits the day the user typed from %s', (timeZone) => {
    expect(inTimeZone(timeZone, () => dateOnlyCodec.parse('2026-06-01'))).toEqual(FIRST_OF_JUNE);
  });

  it.each(FRENCH_TIME_ZONES)('fills the form back with that same day from %s', (timeZone) => {
    expect(inTimeZone(timeZone, () => dateOnlyCodec.encode(FIRST_OF_JUNE))).toBe('2026-06-01');
  });
});

describe('dateOnlyToLocalStartOfDay', () => {
  it.each(FRENCH_TIME_ZONES)('opens the day where the reader stands, in %s', (timeZone) => {
    const startOfDay = inTimeZone(timeZone, () => dateOnlyToLocalStartOfDay(FIRST_OF_JUNE));

    expect([startOfDay.getFullYear(), startOfDay.getMonth() + 1, startOfDay.getDate()]).toEqual([2026, 6, 1]);
    expect(startOfDay.getHours()).toBe(0);
  });
});

describe('compareDateOnly', () => {
  it('orders by year, then month, then day', () => {
    expect(compareDateOnly(FIRST_OF_JUNE, { day: 2, month: 6, year: 2026 })).toBeLessThan(0);
    expect(compareDateOnly(FIRST_OF_JUNE, { day: 28, month: 5, year: 2026 })).toBeGreaterThan(0);
    expect(compareDateOnly(FIRST_OF_JUNE, { day: 1, month: 6, year: 2025 })).toBeGreaterThan(0);
    expect(compareDateOnly(FIRST_OF_JUNE, FIRST_OF_JUNE)).toBe(0);
  });
});
