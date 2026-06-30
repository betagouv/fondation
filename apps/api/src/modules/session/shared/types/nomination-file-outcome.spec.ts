import {
  NominationFileOutcome,
  NominationFileOutcomeRequiresComment,
  UnknownNominationFileOutcome,
  type NominationFileOutcomeEnum,
} from './nomination-file-outcome';

describe('NominationFileOutcome', () => {
  it('should throw when no comment is provided, while requiring one', () => {
    expect(() =>
      NominationFileOutcome.from({
        outcome: 'NON_VALIDATED' satisfies NominationFileOutcomeEnum,
        comment: null,
      }),
    ).toThrow(NominationFileOutcomeRequiresComment);
  });

  it('should consider an empty comment as null', () => {
    expect(() =>
      NominationFileOutcome.from({
        outcome: 'NON_VALIDATED' satisfies NominationFileOutcomeEnum,
        comment: '  ',
      }),
    ).toThrow(NominationFileOutcomeRequiresComment);
  });

  it('should throw, when the provided outcome is unknown', () => {
    expect(() => NominationFileOutcome.from({ outcome: 'unknown', comment: null })).toThrow(
      UnknownNominationFileOutcome,
    );
  });

  it('should parse a string and comment to an outcome', () => {
    const outcome = NominationFileOutcome.from({
      outcome: 'VALIDATED' satisfies NominationFileOutcomeEnum,
      comment: 'this is a comment',
    });

    expect(outcome.outcome).toBe('VALIDATED');
    expect(outcome.comment).toBe('this is a comment');
  });

  it('should allow an empty comment', () => {
    const outcome = NominationFileOutcome.from({
      outcome: 'VALIDATED' satisfies NominationFileOutcomeEnum,
      comment: ' ',
    });

    expect(outcome.comment).toBeNull();
  });

  describe('commentRequired', () => {
    it('requires a comment for an unfavorable outcome', () => {
      expect(NominationFileOutcome.commentRequired('NON_VALIDATED')).toBe(true);
    });

    it.each([
      'VALIDATED',
      'SUSPENDED',
      'REMOVED',
      'WITHDRAWN',
      'ASSESSING',
      'WAITING_DSJ',
    ] satisfies NominationFileOutcomeEnum[])('leaves the comment optional for %s', (outcome) => {
      expect(NominationFileOutcome.commentRequired(outcome)).toBe(false);
    });
  });

  describe('selectableOutcomes', () => {
    it('exposes every outcome in selection order with its label and comment requirement', () => {
      const outcomes = NominationFileOutcome.selectableOutcomes('PARQUET');

      expect(outcomes).toEqual([
        { value: 'VALIDATED', label: 'avis favorable', commentRequired: false },
        { value: 'NON_VALIDATED', label: 'avis défavorable', commentRequired: true },
        { value: 'SUSPENDED', label: 'sursis à statuer', commentRequired: false },
        { value: 'WAITING_DSJ', label: 'en attente complément DSJ', commentRequired: false },
        { value: 'ASSESSING', label: 'en attente évaluation', commentRequired: false },
        { value: 'WITHDRAWN', label: 'retrait (désistement)', commentRequired: false },
        { value: 'REMOVED', label: 'retrait', commentRequired: false },
      ]);
    });

    it('labels the decision outcomes according to the formation', () => {
      const outcomes = NominationFileOutcome.selectableOutcomes('SIEGE');

      expect(outcomes[0]).toEqual({ value: 'VALIDATED', label: 'avis conforme', commentRequired: false });
      expect(outcomes[1]).toEqual({
        value: 'NON_VALIDATED',
        label: 'avis non conforme',
        commentRequired: true,
      });
    });
  });
});
