import { isOpenCourtHeadedByCsm, isRemovedCourt } from './court';

const NOW = new Date('2026-11-19T10:00:00Z');

describe('isRemovedCourt', () => {
  it.each([
    [null, false],
    [new Date('2011-03-31'), true],
    [new Date('2026-11-19'), true],
    [new Date('2027-01-01'), false],
  ])('removes a court suppressed on %s: %s', (dateSuppression, removed) => {
    expect(isRemovedCourt(dateSuppression, NOW)).toBe(removed);
  });
});

describe('isOpenCourtHeadedByCsm', () => {
  const OPEN = new Date('2999-12-31');

  it.each([
    ['CA', true],
    ['TSA', true],
    ['TJ', true],
    ['TPI', true],
    ['TGI', false],
    ['CC', false],
  ])('keeps a court of type %s: %s', (typeJur, kept) => {
    expect(isOpenCourtHeadedByCsm({ dateSuppression: OPEN, typeJur }, NOW)).toBe(kept);
  });

  it('leaves out a removed court', () => {
    expect(isOpenCourtHeadedByCsm({ dateSuppression: new Date('2011-04-01'), typeJur: 'TSA' }, NOW)).toBe(
      false,
    );
  });
});
