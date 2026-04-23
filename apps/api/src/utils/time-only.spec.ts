import { dateToTimeOnly, timeOnlyToDate } from './time-only';

describe('TimeOnly', () => {
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
