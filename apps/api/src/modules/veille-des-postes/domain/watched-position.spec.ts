import { watchedPositionOf } from './watched-position';

describe('watchedPositionOf', () => {
  it.each([
    [
      { courtTypeId: 'CA', functionId: 'PP', gradeId: 'HH', jurisdictionId: 'CA  AGEN' },
      'COURT_OF_APPEAL_FIRST_PRESIDENT',
    ],
    [
      { courtTypeId: 'CC', functionId: 'ACC', gradeId: 'II', jurisdictionId: 'CC  PARIS' },
      'AUDITOR_FIRST_GRADE',
    ],
    [{ courtTypeId: 'CC', functionId: 'PP', gradeId: 'HH', jurisdictionId: 'CC  PARIS' }, 'FIRST_PRESIDENT'],
    [
      { courtTypeId: 'TJ', functionId: 'P', gradeId: 'I', jurisdictionId: 'TJ  AGEN' },
      'JUDICIAL_COURT_PRESIDENT',
    ],
    [
      { courtTypeId: 'TPI', functionId: 'P', gradeId: 'I', jurisdictionId: 'TPI NOUMEA' },
      'JUDICIAL_COURT_PRESIDENT',
    ],
    [
      { courtTypeId: 'TSA', functionId: 'P', gradeId: 'I', jurisdictionId: 'TSA SAINT PIERRE ET MIQUELON' },
      'COURT_OF_APPEAL_FIRST_PRESIDENT',
    ],
  ])('recognizes %j as %s', (lolfi, position) => {
    expect(watchedPositionOf(lolfi)).toBe(position);
  });

  it.each([
    { courtTypeId: 'CA', functionId: 'P', gradeId: 'I', jurisdictionId: 'CA  AGEN' },
    { courtTypeId: 'CC', functionId: 'AV', gradeId: 'I', jurisdictionId: 'CC  PARIS' },
    { courtTypeId: 'TJ', functionId: 'VP', gradeId: 'I', jurisdictionId: 'TJ  AGEN' },
    { courtTypeId: 'TPI', functionId: 'PR', gradeId: 'I', jurisdictionId: 'TPI NOUMEA' },
    { courtTypeId: 'TSA', functionId: 'PR', gradeId: 'I', jurisdictionId: 'TSA SAINT PIERRE ET MIQUELON' },
  ])('leaves out %j, which no table lists', (lolfi) => {
    expect(watchedPositionOf(lolfi)).toBeNull();
  });
});
