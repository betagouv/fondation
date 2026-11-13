import { positionStatusOf } from './position-status';

describe('positionStatusOf', () => {
  it.each([
    [{ alertCount: 0, held: true }, 'OCCUPIED'],
    [{ alertCount: 1, held: true }, 'MAY_BECOME_VACANT'],
    [{ alertCount: 0, held: false }, 'VACANT'],
  ] as const)('gives the position %j the status %s', (position, status) => {
    expect(positionStatusOf(position).id).toBe(status);
  });
});
