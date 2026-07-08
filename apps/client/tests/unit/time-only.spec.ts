import { test } from '@playwright/test';

import { dateToTimeOnly, formTimeOnlyCodec, timeOnlyToDate } from '../../src/utils/time-only.util';

test.describe('TimeOnly', () => {
  test.describe('dateToTimeOnly', () => {
    test('should convert a date to time only', () => {
      const timeOnly = dateToTimeOnly(new Date(2026, 1, 1, 10));
      test.expect(timeOnly).toEqual({ hours: 10, minutes: 0, seconds: 0 });
    });

    test('should return null on invalid date', () => {
      const timeOnly = dateToTimeOnly(new Date(NaN));
      test.expect(timeOnly).toBeNull();
    });
  });

  test.describe('timeOnlyToDate', () => {
    test('should convert a time only object to a date', () => {
      const date = timeOnlyToDate({ hours: 10, minutes: 11, seconds: 12 });
      test.expect(date).toEqual(new Date(2026, 0, 10, 10, 11, 12));
    });

    test('should return null on invalid date', () => {
      const date = timeOnlyToDate({ hours: NaN, minutes: 0, seconds: 0 });
      test.expect(date).toBeNull();
    });
  });

  test.describe('formTimeOnlyCodec', () => {
    test('should convert a string to TimeOnly', () => {
      const result = formTimeOnlyCodec.parse('10:11:12');
      test.expect(result).toEqual({ hours: 10, minutes: 11, seconds: 12 });
    });

    test('should convert a string without seconds to TimeOnly', () => {
      const result = formTimeOnlyCodec.parse('10:11');
      test.expect(result).toEqual({ hours: 10, minutes: 11, seconds: 0 });
    });

    test('should convert timeOnly to string', () => {
      const result = formTimeOnlyCodec.encode({ hours: 10, minutes: 11, seconds: 0 });
      test.expect(result).toBe('10:11');
    });
  });
});
