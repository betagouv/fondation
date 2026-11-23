import { ApiClientRateLimited, RateWindow } from './rate-window';

describe('RateWindow', () => {
  it('should count the calls of a same minute together', () => {
    expect(new RateWindow(new Date('2026-11-18T10:00:00.000Z')).start).toEqual(
      new Date('2026-11-18T10:00:00Z'),
    );
    expect(new RateWindow(new Date('2026-11-18T10:00:59.999Z')).start).toEqual(
      new Date('2026-11-18T10:00:00Z'),
    );
  });

  it('should count the calls of the next minute apart', () => {
    expect(new RateWindow(new Date('2026-11-18T10:01:00.000Z')).start).toEqual(
      new Date('2026-11-18T10:01:00Z'),
    );
  });

  it('should let the call that reaches the limit through', () => {
    expect(() => new RateWindow(new Date('2026-11-18T10:00:20Z')).assertWithin(20, 20)).not.toThrow();
  });

  it('should refuse the call beyond the limit, until the next minute', () => {
    expect(() => new RateWindow(new Date('2026-11-18T10:00:20Z')).assertWithin(20, 21)).toThrow(
      new ApiClientRateLimited(40),
    );
  });

  it('should round the wait up, so that the caller never comes back within the same minute', () => {
    expect(() => new RateWindow(new Date('2026-11-18T10:00:59.999Z')).assertWithin(1, 2)).toThrow(
      new ApiClientRateLimited(1),
    );
    expect(() => new RateWindow(new Date('2026-11-18T10:00:00.000Z')).assertWithin(1, 2)).toThrow(
      new ApiClientRateLimited(60),
    );
  });

  it('should tell the first call refused in the minute from the ones after it', () => {
    const window = new RateWindow(new Date('2026-11-18T10:00:20Z'));

    expect([20, 21, 22].map((count) => window.isFirstOver(20, count))).toEqual([false, true, false]);
  });

  it('should tell the last call let through in the minute from the ones before it', () => {
    const window = new RateWindow(new Date('2026-11-18T10:00:20Z'));

    expect([9, 10, 11].map((count) => window.isLastWithin(10, count))).toEqual([false, true, false]);
  });
});
