import { isPastAudition } from './audition-schedule';

const schedule = { date: { day: 12, month: 3, year: 2028 }, time: { hours: 10, minutes: 30, seconds: 0 } };

describe('isPastAudition', () => {
  it.each([
    ['2028-03-12T09:29:00Z', false],
    ['2028-03-12T09:31:00Z', true],
  ])('compares the audition with the time in Paris at %s', (now, expected) => {
    expect(isPastAudition(schedule, new Date(now))).toBe(expected);
  });
});
