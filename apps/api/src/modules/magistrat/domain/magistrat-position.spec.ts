import { magistratGradeAndJurisdiction } from './magistrat-position';

describe('magistratGradeAndJurisdiction', () => {
  it.each`
    magistrat                                           | expected
    ${{ grade: 'G1', jurisdictionCode: 'TJ  ORLEANS' }} | ${'G1 - TJ ORLEANS'}
    ${{ grade: 'G1', jurisdictionCode: ' CA   LYON ' }} | ${'G1 - CA LYON'}
    ${{ grade: null, jurisdictionCode: 'TJ  ORLEANS' }} | ${'TJ ORLEANS'}
    ${{ grade: 'HH', jurisdictionCode: null }}          | ${'HH'}
    ${{ grade: null, jurisdictionCode: null }}          | ${null}
  `('should write $expected', ({ magistrat, expected }) => {
    expect(magistratGradeAndJurisdiction(magistrat)).toBe(expected);
  });
});
