import { UpdatableNominationFile } from './nomination-file';
import { NominationFileOutcomeEnum } from './nomination-file-outcome';

type IgnoredUpdatableOutcome = Extract<
  NominationFileOutcomeEnum | null,
  /** @see {@link UpdatableNominationFile.IGNORED_OUTCOMES} */
  'SUSPENDED' | 'WAITING_DSJ' | 'ASSESSING' | null
>;

type NonIgnoredUpdatableOutcome = Exclude<NominationFileOutcomeEnum | null, IgnoredUpdatableOutcome>;

describe('UpdatableNominationFile', () => {
  it.each([null, 'SUSPENDED', 'ASSESSING', 'WAITING_DSJ'] satisfies IgnoredUpdatableOutcome[])(
    `outcome %s should be updatable without document links`,
    (outcome) => {
      const isUpdatable = UpdatableNominationFile.from({
        outcome,
        id: `file-id-1`,
        docs: [],
        scheduledAuditionAt: null,
      }).isUpdatable();

      expect(isUpdatable).toBe(true);
    },
  );

  it.each([null, 'SUSPENDED', 'ASSESSING', 'WAITING_DSJ'] satisfies IgnoredUpdatableOutcome[])(
    `outcome %s should be updatable even with document links`,
    (outcome) => {
      const isUpdatable = UpdatableNominationFile.from({
        outcome,
        id: `file-id-1`,
        docs: [
          {
            agenda: { id: 'agenda-1', outcome: 'SUSPENDED' },
            officialReport: { id: 'or-1', outcome: 'SUSPENDED' },
          },
        ],
        scheduledAuditionAt: null,
      }).isUpdatable();

      expect(isUpdatable).toBe(true);
    },
  );

  it.each(['NON_VALIDATED', 'VALIDATED', 'REMOVED', 'WITHDRAWN'] satisfies NonIgnoredUpdatableOutcome[])(
    `outcome %s AND linked to doc should NOT be updatable`,
    (outcome) => {
      const isUpdatable = UpdatableNominationFile.from({
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
        scheduledAuditionAt: null,
      }).isUpdatable();

      expect(isUpdatable).toBe(false);
    },
  );
});
