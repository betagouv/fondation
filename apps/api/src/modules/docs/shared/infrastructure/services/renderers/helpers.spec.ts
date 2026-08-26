import { FRENCH_TIME_ZONES } from 'src/utils/french-time-zones';

import { date as renderDate, requiresElision } from './helpers';

const systemTimeZone = process.env.TZ;
afterEach(() => {
  process.env.TZ = systemTimeZone;
});

describe('renderer helpers', () => {
  describe('date', () => {
    // Intl.DateTimeFormat freezes its zone when it is constructed, and ours are built once when
    // the module loads: only reloading it under the server's zone proves anything here.
    it.each(FRENCH_TIME_ZONES)('prints the day a document date carries, from %s', async (timeZone) => {
      vi.resetModules();
      process.env.TZ = timeZone;
      const { date: reloaded } = await import('./helpers');

      expect(reloaded({ year: 2026, month: 6, day: 1 })).toBe('01/06/2026');
      expect(reloaded({ year: 2026, month: 6, day: 2 }, 'do MMMM yyyy')).toBe('2 juin 2026');
      expect(reloaded({ year: 2026, month: 6, day: 1 }, 'do MMMM yyyy')).toBe('1<sup>er</sup> juin 2026');
    });

    it('takes an ordinal on the first of the month, and only there', () => {
      expect(renderDate({ year: 2026, month: 6, day: 1 }, 'do MMMM yyyy')).toBe('1<sup>er</sup> juin 2026');
      expect(renderDate({ year: 2026, month: 6, day: 11 }, 'do MMMM yyyy')).toBe('11 juin 2026');
      expect(renderDate({ year: 2026, month: 6, day: 21 }, 'do MMMM yyyy')).toBe('21 juin 2026');
    });
  });

  describe('requiresElision', () => {
    it.each`
      word            | expected
      ${'Procureur'}  | ${false}
      ${'Substitut'}  | ${false}
      ${'Avocat'}     | ${true}
      ${'Inspecteur'} | ${true}
      ${'Échevin'}    | ${true}
      ${'Huissier'}   | ${true}
      ${'  Avocat'}   | ${true}
      ${''}           | ${false}
    `(`returns $expected for "$word"`, ({ word, expected }) => {
      expect(requiresElision(word)).toBe(expected);
    });
  });
});
