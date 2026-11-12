import { heldPositionMatches } from './position-status';

describe('heldPositionMatches', () => {
  it.each([
    [[], true],
    [['OCCUPIED', 'VACANT'], true],
    [['VACANT'], false],
  ] as const)('tells whether a held position matches the statuses %j', (statuses, matches) => {
    expect(heldPositionMatches(statuses)).toBe(matches);
  });
});
