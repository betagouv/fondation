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
        docs: { isLinkedToAgenda: false, isLinkedToOfficialReport: false, isLinkedToPresentationPlan: false },
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
        docs: { isLinkedToAgenda: true, isLinkedToOfficialReport: false, isLinkedToPresentationPlan: false },
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
        docs: { isLinkedToAgenda: true, isLinkedToOfficialReport: false, isLinkedToPresentationPlan: false },
      }).isUpdatable();

      expect(isUpdatable).toBe(false);
    },
  );

  it.each`
    agenda   | officialReport | presentationPlan | expectedUpdatable
    ${false} | ${false}       | ${false}         | ${true}
    ${false} | ${false}       | ${true}          | ${false}
    ${false} | ${true}        | ${false}         | ${false}
    ${false} | ${true}        | ${true}          | ${false}
    ${true}  | ${false}       | ${false}         | ${false}
    ${true}  | ${false}       | ${true}          | ${false}
    ${true}  | ${true}        | ${true}          | ${false}
  `(
    `(outcome=VALIDATED, isLinkedToAgenda=$agenda, isLinkedToOfficialReport=$officialReport, isLinkedToPresentationPlan=$presentationPlan) => isUpdatable=$expectedUpdatable`,
    ({
      agenda,
      officialReport,
      presentationPlan,
      expectedUpdatable,
    }: {
      agenda: boolean;
      officialReport: boolean;
      presentationPlan: boolean;
      expectedUpdatable: boolean;
    }) => {
      const outcome: NonIgnoredUpdatableOutcome = 'VALIDATED';
      const isUpdatable = UpdatableNominationFile.from({
        outcome,
        id: `file-id-1`,
        docs: {
          isLinkedToAgenda: agenda,
          isLinkedToOfficialReport: officialReport,
          isLinkedToPresentationPlan: presentationPlan,
        },
      }).isUpdatable();

      expect(isUpdatable).toBe(expectedUpdatable);
    },
  );
});
