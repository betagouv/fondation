import { heldPositionMatches, unheldPositionMatches } from './position-status';

describe('heldPositionMatches', () => {
  it.each([
    [[], true],
    [['OCCUPIED', 'VACANT'], true],
    [['VACANT'], false],
  ] as const)('tells whether a held position matches the statuses %j', (statuses, matches) => {
    expect(heldPositionMatches(statuses)).toBe(matches);
  });
});

describe('unheldPositionMatches', () => {
  it.each([
    [[], true],
    [['OCCUPIED', 'VACANT'], true],
    [['OCCUPIED'], false],
  ] as const)('tells whether a position without holder matches the statuses %j', (statuses, matches) => {
    expect(unheldPositionMatches(statuses)).toBe(matches);
  });
});
