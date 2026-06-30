import { NominationFileOutcome } from '../nomination-file-outcome';

import { canScheduleAudition, canUpdateTransparenceFile } from './transparence-file.policies';

describe('canUpdateTransparenceFile', () => {
  describe('given a non-archived session', () => {
    const session = { archivedAt: null };

    it.each([null, ...NominationFileOutcome.nonFinalOutcomes()])(
      `outcome %s should be updatable without document links`,
      (outcome) => {
        const isUpdatable = canUpdateTransparenceFile(
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
        const isUpdatable = canUpdateTransparenceFile(
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
        const isUpdatable = canUpdateTransparenceFile(
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
      expect(canUpdateTransparenceFile({ outcome, id: 'file-id', docs: [] }, session)).toBe(false);
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
