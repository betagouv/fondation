import {
  ObservationFollowUp,
  ObservationFollowUpRequiresComment,
  UnknownObservationFollowUp,
} from './observation-follow-up';

describe('ObservationFollowUp', () => {
  it('should throw if follow-up status requires comment and none is provided', () => {
    expect(() => ObservationFollowUp.from({ followUp: 'INTERESTING', comment: null })).toThrow(
      ObservationFollowUpRequiresComment,
    );
  });

  it('should throw if follow-up status is unknown', () => {
    expect(() => ObservationFollowUp.from({ followUp: 'UNKNOWN', comment: null })).toThrow(
      UnknownObservationFollowUp,
    );
  });

  it('should store a follow-up status and comment', () => {
    const { status, comment } = ObservationFollowUp.from({
      followUp: 'INTERESTING',
      comment: '   this is a comment   ',
    });

    expect(status).toBe('INTERESTING');
    expect(comment).toBe('this is a comment');
  });

  describe('commentSeenBy', () => {
    it.each(['ADJOINT_SECRETAIRE_GENERAL'] as const)('shows the comment to %s', (role) => {
      expect(ObservationFollowUp.commentSeenBy({ comment: 'a comment', role })).toBe('a comment');
    });

    it.each(['MEMBRE_COMMUN', 'MEMBRE_DU_PARQUET', 'MEMBRE_DU_SIEGE'] as const)(
      'hides the comment from %s',
      (role) => {
        expect(ObservationFollowUp.commentSeenBy({ comment: 'a comment', role })).toBeNull();
      },
    );
  });
});
