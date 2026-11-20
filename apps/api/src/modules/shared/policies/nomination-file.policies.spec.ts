import { NominationFileOutcome } from '../nomination-file-outcome.enum';

import {
  canScheduleAudition,
  canUpdateNominationFile,
  memberMemoVisibility,
  nominationFileLock,
  sgCommentChangeSeenBy,
} from './nomination-file.policies';

describe('nominationFileLock', () => {
  describe('given a non-archived session', () => {
    const session = { isArchived: false };

    it('leaves a file open while it has not been reported', () => {
      expect(nominationFileLock({ isReported: false }, session)).toBeNull();
    });

    it('locks a file already acted in a restituted official report', () => {
      expect(nominationFileLock({ isReported: true }, session)).toBe('REPORTED');
    });
  });

  describe('given an archived session', () => {
    const session = { isArchived: true };

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
    const session = { isArchived: false };

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
    const session = { isArchived: true };
    it.each(NominationFileOutcome.enum)(`prevents to schedule an audition with outcome: %s`, (outcome) => {
      expect(canScheduleAudition({ outcome }, session)).toBe(false);
    });
  });
});

describe('memberMemoVisibility', () => {
  const member = { id: 'member-1', impersonation: undefined, role: 'MEMBRE_DU_SIEGE' } as const;

  it('lets a member keep notes on a file reported by others', () => {
    expect(memberMemoVisibility({ reporterIds: ['member-2'] }, member)).toBe('VISIBLE');
  });

  it('keeps the notes of a member private from the admin impersonating them', () => {
    const impersonated = { ...member, impersonation: { impersonatorId: 'admin-1' } };

    expect(memberMemoVisibility({ reporterIds: ['member-2'] }, impersonated)).toBe('PRIVATE');
  });

  it('keeps a reporter from taking notes on a file in their charge', () => {
    expect(memberMemoVisibility({ reporterIds: ['member-2', member.id] }, member)).toBeNull();
  });

  it.each(['ADJOINT_SECRETAIRE_GENERAL'] as const)('keeps the secretariat (%s) from taking notes', (role) => {
    expect(
      memberMemoVisibility({ reporterIds: [] }, { id: 'sg-1', impersonation: undefined, role }),
    ).toBeNull();
  });
});

describe('canUpdateNominationFile', () => {
  const secretariat = { role: 'ADJOINT_SECRETAIRE_GENERAL' } as const;

  it('lets the secretariat update an open file', () => {
    expect(canUpdateNominationFile({ lockedReason: null }, secretariat)).toBe(true);
  });

  it.each(['ARCHIVED_SESSION', 'REPORTED'] as const)('freezes a locked file (%s)', (lockedReason) => {
    expect(canUpdateNominationFile({ lockedReason }, secretariat)).toBe(false);
  });

  it.each(['MEMBRE_COMMUN', 'MEMBRE_DU_PARQUET', 'MEMBRE_DU_SIEGE'] as const)(
    'never lets a member (%s) update it',
    (role) => {
      expect(canUpdateNominationFile({ lockedReason: null }, { role })).toBe(false);
    },
  );
});

describe('sgCommentChangeSeenBy', () => {
  const change = { at: '2026-11-18T09:42:00.000Z', by: { id: 'sg-1', name: 'Anne\u00A0ROY' } };

  it('names the author to the secretariat', () => {
    expect(sgCommentChangeSeenBy(change, { role: 'ADJOINT_SECRETAIRE_GENERAL' })).toEqual(change);
  });

  it.each(['MEMBRE_COMMUN', 'MEMBRE_DU_PARQUET', 'MEMBRE_DU_SIEGE'] as const)(
    'gives the date without the author to a %s',
    (role) => {
      expect(sgCommentChangeSeenBy(change, { role })).toEqual({ at: change.at, by: null });
    },
  );
});
