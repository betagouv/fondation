import { NominationFileOutcome } from '../types/nomination-file-outcome';

import { canScheduleAudition, canUpdateNominationFile, isAuditionExpected } from './nomination-file.policies';

describe('canUpdateTransparenceFile', () => {
  describe('given a non-archived session', () => {
    const session = { archivedAt: null };

    it.each([null, ...NominationFileOutcome.nonFinalOutcomes()])(
      `outcome %s should be updatable without document links`,
      (outcome) => {
        const isUpdatable = canUpdateNominationFile(
          {
            outcome,
            id: `file-id-1`,
            docs: [],
          },
          session,
        );

        expect(isUpdatable).toBe(true);
      },
    );

    it.each([null, ...NominationFileOutcome.nonFinalOutcomes()])(
      `outcome %s should be updatable even with document links`,
      (outcome) => {
        const isUpdatable = canUpdateNominationFile(
          {
            outcome,
            id: `file-id-1`,
            docs: [
              {
                agenda: { id: 'agenda-1', outcome: 'SUSPENDED' },
                officialReport: { id: 'or-1', outcome: 'SUSPENDED' },
              },
            ],
          },
          session,
        );

        expect(isUpdatable).toBe(true);
      },
    );

    it.each(NominationFileOutcome.finalOutcomes())(
      `outcome %s AND linked to doc should NOT be updatable`,
      (outcome) => {
        const isUpdatable = canUpdateNominationFile(
          {
            outcome,
            id: `file-id-1`,
            docs: [
              {
                agenda: { id: 'agenda-1', outcome: 'SUSPENDED' },
                officialReport: {
                  id: 'or-1',
                  outcome: outcome === 'REMOVED' ? 'WITHDRAWN' : outcome,
                },
              },
            ],
          },
          session,
        );

        expect(isUpdatable).toBe(false);
      },
    );
  });

  describe('given an archived session', () => {
    const session = { archivedAt: new Date() };
    it.each(NominationFileOutcome.enum)(`outcome %s should not be allowed to be updated`, (outcome) => {
      expect(canUpdateNominationFile({ outcome, id: 'file-id', docs: [] }, session)).toBe(false);
    });
  });
});

describe('canScheduleAudition', () => {
  describe('given a non-archived session', () => {
    const session = { archivedAt: null };

    it('allows an audition when no outcome is defined yet', () => {
      expect(canScheduleAudition({ outcome: null }, session)).toBe(true);
    });

    it.each(NominationFileOutcome.nonFinalOutcomes())(
      'allows an audition while the outcome is still pending (%s)',
      (outcome) => {
        expect(canScheduleAudition({ outcome }, session)).toBe(true);
      },
    );

    it.each(NominationFileOutcome.finalOutcomes())(
      'forbids an audition once the decision is final (%s)',
      (outcome) => {
        expect(canScheduleAudition({ outcome }, session)).toBe(false);
      },
    );
  });

  describe('given an archived session', () => {
    const session = { archivedAt: new Date() };
    it.each(NominationFileOutcome.enum)(`prevents to schedule an audition with outcome: %s`, (outcome) => {
      expect(canScheduleAudition({ outcome }, session)).toBe(false);
    });
  });
});

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
