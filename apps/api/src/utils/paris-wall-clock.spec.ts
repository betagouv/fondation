import { toParisWallClock } from './paris-wall-clock';

describe('toParisWallClock', () => {
  it('shifts a winter instant by one hour', () => {
    const wallClock = toParisWallClock(new Date('2026-01-10T14:30:00Z'));

    expect(wallClock).toEqual(new Date('2026-01-10T15:30:00Z'));
  });

  it('shifts a summer instant by two hours', () => {
    const wallClock = toParisWallClock(new Date('2026-07-10T14:30:00Z'));

    expect(wallClock).toEqual(new Date('2026-07-10T16:30:00Z'));
  });

  it('rolls over to the next day around midnight', () => {
    const wallClock = toParisWallClock(new Date('2026-07-10T23:30:00Z'));

    expect(wallClock).toEqual(new Date('2026-07-11T01:30:00Z'));
  });
});
