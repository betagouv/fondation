import {
  courtOfCassationPositionOfRank,
  holderServiceOf,
  rankedLolfiPositions,
} from './court-of-cassation-position';

describe('rankedLolfiPositions', () => {
  it('ranks every LOLFI position by the hierarchy, the counsellors in extraordinary service among the counsellors and the auditors on either grade scale', () => {
    expect(rankedLolfiPositions()).toEqual({
      functionIds: ['PP', 'PC', 'C', 'C SE', 'CR', 'ACC', 'ACC', 'ACC', 'ACC'],
      gradeIds: [null, null, null, null, null, 'G2', 'I', 'G1', 'II'],
      ranks: [0, 1, 2, 2, 3, 4, 4, 5, 5],
    });
  });
});

describe('courtOfCassationPositionOfRank', () => {
  it('gives the position of a rank with its label', () => {
    expect(courtOfCassationPositionOfRank(2)).toEqual({ id: 'COUNSELLOR', label: 'Conseiller' });
  });
});

describe('holderServiceOf', () => {
  it.each([
    ['C SE', 'EXTRAORDINARY'],
    ['C', 'ORDINARY'],
  ] as const)('gives the function %s an %s service', (functionId, service) => {
    expect(holderServiceOf(functionId).id).toBe(service);
  });
});
