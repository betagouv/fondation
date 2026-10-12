import { NominationFileOutcome } from '../nomination-file-outcome.enum';

import { canScheduleAudition, nominationFileLock } from './nomination-file.policies';

describe('nominationFileLock', () => {
  describe('given a non-archived session', () => {
    const session = { archivedAt: null };

    it('leaves a file open while it has not been reported', () => {
      expect(nominationFileLock({ isReported: false }, session)).toBeNull();
    });

    it('locks a file already acted in a restituted official report', () => {
      expect(nominationFileLock({ isReported: true }, session)).toBe('REPORTED');
    });
  });

  describe('given an archived session', () => {
    const session = { archivedAt: new Date() };

    it('locks a file that was never reported', () => {
      expect(nominationFileLock({ isReported: false }, session)).toBe('ARCHIVED_SESSION');
    });

    it('blames the archive first', () => {
      expect(nominationFileLock({ isReported: true }, session)).toBe('ARCHIVED_SESSION');
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
