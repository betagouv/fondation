import {
  auditionRequirementOf,
  expectedReportersCount,
  isAuditionExpected,
  isAuditionRequired,
} from './auditioned-position.policy';

function file(props: {
  detectedJurisdictionId?: string | null;
  detectedJurisdictionType?: string | null;
  detectedTargetedFunctionId?: string | null;
  targetedPosition?: string | null;
}) {
  return {
    detectedJurisdictionId: props.detectedJurisdictionId ?? null,
    detectedJurisdictionType: props.detectedJurisdictionType ?? null,
    detectedTargetedFunctionId: props.detectedTargetedFunctionId ?? null,
    targetedPosition: props.targetedPosition ?? null,
  };
}

describe('isAuditionExpected', () => {
  it.each([
    '1PC',
    'IG-CIGJ',
    'IGJ',
    'IGSJ',
    'PG',
    'PR',
    'PR F',
    'PRA F',
    'PRACO',
    'PRACOADJ',
    'PRAT',
    'PRATA',
  ])('expects an audition for the targeted function %s whatever the jurisdiction', (functionId) => {
    expect(
      isAuditionExpected(
        file({
          detectedJurisdictionId: 'CA  LYON',
          detectedJurisdictionType: 'CA',
          detectedTargetedFunctionId: functionId,
        }),
      ),
    ).toBe(true);
  });

  it.each([
    ['1AG', 'CC  PARIS'],
    ['1VP', 'TJ  PARIS'],
    ['AG', 'CC  PARIS'],
    ['AG SE', 'CC  PARIS'],
    ['AGR', 'CC  PARIS'],
    ['PRA', 'TJ  PARIS'],
  ])('expects an audition for the function %s at %s', (functionId, jurisdictionId) => {
    expect(
      isAuditionExpected(
        file({ detectedJurisdictionId: jurisdictionId, detectedTargetedFunctionId: functionId }),
      ),
    ).toBe(true);
  });

  it.each([
    ['1VP', 'TJ  LYON'],
    ['AG', 'CA  LYON'],
    ['PRA', 'TJ  LYON'],
  ])(
    'does not expect an audition for the function %s outside the targeted jurisdiction (%s)',
    (functionId, jurisdictionId) => {
      expect(
        isAuditionExpected(
          file({
            detectedJurisdictionId: jurisdictionId,
            detectedJurisdictionType: jurisdictionId.slice(0, 2),
            detectedTargetedFunctionId: functionId,
          }),
        ),
      ).toBe(false);
    },
  );

  it('expects an audition for the first advocate general of any court of appeal', () => {
    expect(
      isAuditionExpected(
        file({
          detectedJurisdictionId: 'CA  LYON',
          detectedJurisdictionType: 'CA',
          detectedTargetedFunctionId: '1AG',
        }),
      ),
    ).toBe(true);
  });

  it('falls back on the position label when the file predates LOLFI detection', () => {
    expect(
      isAuditionExpected(file({ targetedPosition: "Procureur Général près la cour d'appel de Lyon" })),
    ).toBe(true);
  });

  it('does not expect an audition for a regular position', () => {
    expect(isAuditionExpected(file({ targetedPosition: 'Président de chambre CA AIX EN PROVENCE' }))).toBe(
      false,
    );
  });
});

describe('isAuditionRequired', () => {
  const auditionedPosition = file({ detectedTargetedFunctionId: 'PG' });
  const regularPosition = file({ targetedPosition: 'Président de chambre CA AIX EN PROVENCE' });

  it('follows the position until the secretariat decides', () => {
    expect(isAuditionRequired({ ...auditionedPosition, auditionRequested: null })).toBe(true);
    expect(isAuditionRequired({ ...regularPosition, auditionRequested: null })).toBe(false);
  });

  it('lets the secretariat request an audition on a regular position', () => {
    expect(isAuditionRequired({ ...regularPosition, auditionRequested: true })).toBe(true);
  });
});

describe('auditionRequirementOf', () => {
  const auditionedPosition = file({ detectedTargetedFunctionId: 'PG' });
  const regularPosition = file({ targetedPosition: 'Président de chambre CA AIX EN PROVENCE' });

  it('credits the position whenever it requires the audition', () => {
    expect(auditionRequirementOf({ ...auditionedPosition, auditionRequested: true })).toBe('POSITION');
  });

  it('credits the secretariat with an audition added on a regular position', () => {
    expect(auditionRequirementOf({ ...regularPosition, auditionRequested: true })).toBe('SECRETARIAT');
  });
});

describe('expectedReportersCount', () => {
  it('expects two reporters on an auditioned position', () => {
    expect(
      expectedReportersCount(file({ detectedJurisdictionId: 'CA  LYON', detectedTargetedFunctionId: 'PG' })),
    ).toBe(2);
  });

  it('expects nothing in particular on a regular position', () => {
    expect(
      expectedReportersCount(file({ targetedPosition: 'Président de chambre CA AIX EN PROVENCE' })),
    ).toBeNull();
  });
});
