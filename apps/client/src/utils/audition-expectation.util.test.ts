import { describe, expect, it } from 'vitest';

import { areReportersMissing, isAuditionMissing } from './audition-expectation.util';

const SCHEDULED = { day: 15, month: 6, year: 2029 };
const AUDITIONED = { auditionDate: null, auditionExpected: true, canScheduleAudition: true };
const TWO_REPORTERS_EXPECTED = { canAffectReporters: true, expectedReportersCount: 2 };

describe('isAuditionMissing', () => {
  it('expects an audition on an auditioned position without a date', () => {
    expect(isAuditionMissing(AUDITIONED)).toBe(true);
  });

  it('expects nothing once the audition is scheduled', () => {
    expect(isAuditionMissing({ ...AUDITIONED, auditionDate: SCHEDULED })).toBe(false);
  });

  it('expects nothing on a position without audition', () => {
    expect(isAuditionMissing({ ...AUDITIONED, auditionExpected: false })).toBe(false);
  });

  it('expects nothing on a file that no longer accepts an audition', () => {
    expect(isAuditionMissing({ ...AUDITIONED, canScheduleAudition: false })).toBe(false);
  });
});

describe('areReportersMissing', () => {
  it('expects a second reporter when the position asks for two', () => {
    expect(areReportersMissing(TWO_REPORTERS_EXPECTED, 1)).toBe(true);
  });

  it('expects nothing once the expected reporters are affected', () => {
    expect(areReportersMissing(TWO_REPORTERS_EXPECTED, 2)).toBe(false);
  });

  it('expects nothing on a position carrying no expectation', () => {
    expect(areReportersMissing({ ...TWO_REPORTERS_EXPECTED, expectedReportersCount: null }, 0)).toBe(false);
  });

  it('expects nothing on a file that no longer accepts an affectation', () => {
    expect(areReportersMissing({ ...TWO_REPORTERS_EXPECTED, canAffectReporters: false }, 0)).toBe(false);
  });
});
