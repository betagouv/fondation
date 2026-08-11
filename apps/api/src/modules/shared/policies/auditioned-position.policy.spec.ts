import { expectedReportersCount, isAuditionExpected } from './auditioned-position.policy';

describe('isAuditionExpected', () => {
  it.each(['PG', 'PR F', 'PRAT', '1PC'])('expects an audition for the targeted function %s', (functionId) => {
    expect(
      isAuditionExpected({
        detectedJurisdictionId: 'CA  LYON',
        detectedTargetedFunctionId: functionId,
        targetedPosition: null,
      }),
    ).toBe(true);
  });

  it.each([
    ['1AG', 'CC  PARIS'],
    ['AG', 'CC  PARIS'],
    ['PR', 'TJ  PARIS'],
  ])('expects an audition for the function %s at %s', (functionId, jurisdictionId) => {
    expect(
      isAuditionExpected({
        detectedJurisdictionId: jurisdictionId,
        detectedTargetedFunctionId: functionId,
        targetedPosition: null,
      }),
    ).toBe(true);
  });

  it('does not expect an audition for the same function outside the targeted jurisdiction', () => {
    expect(
      isAuditionExpected({
        detectedJurisdictionId: 'CA  GRENOBLE',
        detectedTargetedFunctionId: 'PR',
        targetedPosition: null,
      }),
    ).toBe(false);
  });

  it('falls back on the position label when the file predates LOLFI detection', () => {
    expect(
      isAuditionExpected({
        detectedJurisdictionId: null,
        detectedTargetedFunctionId: null,
        targetedPosition: "Procureur Général près la cour d'appel de Lyon",
      }),
    ).toBe(true);
  });

  it('does not expect an audition for a regular position', () => {
    expect(
      isAuditionExpected({
        detectedJurisdictionId: null,
        detectedTargetedFunctionId: null,
        targetedPosition: 'Président de chambre CA AIX EN PROVENCE',
      }),
    ).toBe(false);
  });
});

describe('expectedReportersCount', () => {
  it('expects two reporters on an auditioned position', () => {
    expect(
      expectedReportersCount({
        detectedJurisdictionId: 'CA  LYON',
        detectedTargetedFunctionId: 'PG',
        targetedPosition: null,
      }),
    ).toBe(2);
  });

  it('expects nothing in particular on a regular position', () => {
    expect(
      expectedReportersCount({
        detectedJurisdictionId: null,
        detectedTargetedFunctionId: null,
        targetedPosition: 'Président de chambre CA AIX EN PROVENCE',
      }),
    ).toBeNull();
  });
});
