import {
  ObservantAuditionDropped,
  Observation,
  ObservationDeleted,
  ObservationFollowedUp,
  ObservationUpdated,
} from './observation';
import { ObservationFollowUp } from './observation-follow-up';

describe('Observation', () => {
  it('should follow-up on an observation', () => {
    const observation = Observation.from({
      id: 'obs-1',
      dateReception: new Date(),
      magistratId: 'magistrat-1',
      nominationFileId: 'file-1',
      sessionId: 'session-1',
    });

    observation.followUpWith({
      comment: 'this is a comment',
      followUp: 'INTERESTING',
      userId: 'user-id',
    });

    const [message] = observation.messages;
    expect(message).toEqual(
      new ObservationFollowedUp(
        'obs-1',
        ObservationFollowUp.from({
          followUp: 'INTERESTING',
          comment: 'this is a comment',
        }),
        'user-id',
      ),
    );
  });

  it('should remove observation follow-up', () => {
    const observation = Observation.from({
      id: 'obs-1',
      dateReception: new Date(),
      magistratId: 'magistrat-1',
      nominationFileId: 'file-1',
      sessionId: 'session-1',
    });

    observation.followUpWith({
      comment: null,
      followUp: null,
      userId: 'user-id',
    });

    const [message] = observation.messages;
    expect(message).toEqual(new ObservationFollowedUp('obs-1', null, null));
  });

  describe('the audition of the observant', () => {
    const AUTHOR = { impersonatorId: null, userId: 'user-1' };
    const observation = () =>
      Observation.from({
        dateReception: new Date(2026, 4, 2),
        id: 'obs-1',
        magistratId: 'magistrat-1',
        nominationFileId: 'file-1',
        sessionId: 'session-1',
      });

    it('drops the audition with the last observation of the observant', () => {
      const deleted = observation();

      deleted.delete({ ...AUTHOR, isLastOfObservant: true });

      expect(deleted.messages).toEqual([
        new ObservationDeleted('obs-1'),
        new ObservantAuditionDropped('session-1', 'magistrat-1', 'user-1', null),
      ]);
    });

    it('keeps the audition while the observant has other observations', () => {
      const deleted = observation();

      deleted.delete({ ...AUTHOR, isLastOfObservant: false });

      expect(deleted.messages).toEqual([new ObservationDeleted('obs-1')]);
    });

    it('drops the audition of the replaced observant when it was their last observation', () => {
      const updated = observation();

      updated.update({
        ...AUTHOR,
        dateReception: new Date(2026, 4, 2),
        description: '',
        isLastOfObservant: true,
        magistratId: 'magistrat-2',
      });

      expect(updated.messages).toContainEqual(
        new ObservantAuditionDropped('session-1', 'magistrat-1', 'user-1', null),
      );
    });

    it('keeps the audition when the observant stays the same', () => {
      const updated = observation();

      updated.update({
        ...AUTHOR,
        dateReception: new Date(2026, 4, 2),
        description: '',
        isLastOfObservant: true,
        magistratId: 'magistrat-1',
      });

      expect(updated.messages).toEqual([expect.any(ObservationUpdated)]);
    });
  });
});
