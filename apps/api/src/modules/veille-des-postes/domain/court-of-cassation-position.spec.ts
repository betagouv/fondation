import {
  courtOfCassationPositionOfRank,
  holderServiceOf,
  rankedLolfiPositions,
} from './court-of-cassation-position';

describe('rankedLolfiPositions', () => {
  it('ranks every LOLFI position by the hierarchy when none is asked, the counsellors in extraordinary service among the counsellors and the auditors on either grade scale', () => {
    expect(rankedLolfiPositions([])).toEqual({
      functionIds: ['PP', 'PC', 'C', 'C SE', 'CR', 'ACC', 'ACC', 'ACC', 'ACC'],
      gradeIds: [null, null, null, null, null, 'G1', 'II', 'G2', 'I'],
      ranks: [0, 1, 2, 2, 3, 4, 4, 5, 5],
    });
  });

  it('keeps the rank of a position in the hierarchy when only some are asked', () => {
    expect(rankedLolfiPositions(['AUDITOR_SECOND_GRADE', 'COUNSELLOR'])).toEqual({
      functionIds: ['C', 'C SE', 'ACC', 'ACC'],
      gradeIds: [null, null, 'G2', 'I'],
      ranks: [2, 2, 5, 5],
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
