import {
  NominationFileOutcome,
  NominationFileOutcomeRequiresComment,
  UnknownNominationFileOutcome,
  type NominationFileOutcomeEnum,
} from 'src/modules/shared/nomination-file-outcome.enum';

describe('NominationFileOutcome', () => {
  it('should throw when no comment is provided, while requiring one', () => {
    expect(() =>
      NominationFileOutcome.from({
        comment: null,
        outcome: 'NON_VALIDATED' satisfies NominationFileOutcomeEnum,
      }),
    ).toThrow(NominationFileOutcomeRequiresComment);
  });

  it('should consider an empty comment as null', () => {
    expect(() =>
      NominationFileOutcome.from({
        comment: '  ',
        outcome: 'NON_VALIDATED' satisfies NominationFileOutcomeEnum,
      }),
    ).toThrow(NominationFileOutcomeRequiresComment);
  });

  it('should throw, when the provided outcome is unknown', () => {
    expect(() => NominationFileOutcome.from({ comment: null, outcome: 'unknown' })).toThrow(
      UnknownNominationFileOutcome,
    );
  });

  it('should parse a string and comment to an outcome', () => {
    const outcome = NominationFileOutcome.from({
      comment: 'this is a comment',
      outcome: 'VALIDATED' satisfies NominationFileOutcomeEnum,
    });

    expect(outcome.outcome).toBe('VALIDATED');
    expect(outcome.comment).toBe('this is a comment');
  });

  it('should allow an empty comment', () => {
    const outcome = NominationFileOutcome.from({
      comment: ' ',
      outcome: 'VALIDATED' satisfies NominationFileOutcomeEnum,
    });

    expect(outcome.comment).toBeNull();
  });

  describe('statusOf', () => {
    it.each(NominationFileOutcome.finalOutcomes())('considers %s as final', (outcome) => {
      expect(NominationFileOutcome.statusOf(outcome)).toBe('FINAL');
    });

    it.each(NominationFileOutcome.nonFinalOutcomes())('considers %s as pending', (outcome) => {
      expect(NominationFileOutcome.statusOf(outcome)).toBe('PENDING');
    });
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
      'WAITING_DSJ',
    ] satisfies NominationFileOutcomeEnum[])('leaves the comment optional for %s', (outcome) => {
      expect(NominationFileOutcome.commentRequired(outcome)).toBe(false);
    });
  });

  describe('selectableOutcomes', () => {
    it('exposes every outcome in selection order with its label and comment requirement', () => {
      const outcomes = NominationFileOutcome.selectableOutcomes('PARQUET');

      expect(outcomes).toEqual([
        { commentRequired: false, label: 'avis favorable', value: 'VALIDATED' },
        { commentRequired: true, label: 'avis défavorable', value: 'NON_VALIDATED' },
        { commentRequired: false, label: 'sursis à statuer', value: 'SUSPENDED' },
        { commentRequired: false, label: 'en attente complément DSJ', value: 'WAITING_DSJ' },
        { commentRequired: false, label: 'retrait (désistement)', value: 'WITHDRAWN' },
        { commentRequired: false, label: 'retrait', value: 'REMOVED' },
      ]);
    });

    it('labels the decision outcomes according to the formation', () => {
      const outcomes = NominationFileOutcome.selectableOutcomes('SIEGE');

      expect(outcomes[0]).toEqual({ commentRequired: false, label: 'avis conforme', value: 'VALIDATED' });
      expect(outcomes[1]).toEqual({
        commentRequired: true,
        label: 'avis non conforme',
        value: 'NON_VALIDATED',
      });
    });
  });
});
