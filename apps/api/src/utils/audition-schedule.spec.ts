import { isPastAudition, toOptionalAuditionSchedule } from './audition-schedule';

const schedule = { date: { day: 12, month: 3, year: 2028 }, time: { hours: 10, minutes: 30, seconds: 0 } };

describe('isPastAudition', () => {
  it.each([
    ['2028-03-12T09:29:00Z', false],
    ['2028-03-12T09:31:00Z', true],
  ])('compares the audition with the time in Paris at %s', (now, expected) => {
    expect(isPastAudition(schedule, new Date(now))).toBe(expected);
  });
});

describe('toOptionalAuditionSchedule', () => {
  it('needs both the date and the time', () => {
    expect(toOptionalAuditionSchedule(new Date('2028-12-12T00:00:00Z'), null)).toBeNull();
  });

  it('builds the schedule from the date and the time', () => {
    expect(
      toOptionalAuditionSchedule(new Date('2028-12-12T00:00:00Z'), new Date('1970-01-01T09:30:00Z')),
    ).toEqual({ date: { day: 12, month: 12, year: 2028 }, time: { hours: 9, minutes: 30, seconds: 0 } });
  });
});
