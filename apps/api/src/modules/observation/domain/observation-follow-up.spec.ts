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
});
