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
    expect(() =>
      NominationFileOutcome.from({ outcome: 'unknown', comment: null }),
    ).toThrow(UnknownNominationFileOutcome);
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
});
