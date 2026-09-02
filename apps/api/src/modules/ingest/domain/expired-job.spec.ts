import { isExpired } from './expired-job';

describe('isExpired', () => {
  const now = new Date('2026-09-02T06:00:00Z');

  it('keeps a job started an hour ago', () => {
    expect(isExpired({ startedAt: new Date('2026-09-02T05:00:00Z') }, now)).toBe(false);
  });

  it('expires a job started three hours ago', () => {
    expect(isExpired({ startedAt: new Date('2026-09-02T03:00:00Z') }, now)).toBe(true);
  });

  it('expires a running job that never recorded its start', () => {
    expect(isExpired({ startedAt: null }, now)).toBe(true);
  });
});
