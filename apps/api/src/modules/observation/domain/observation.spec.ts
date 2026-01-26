import { Observation, ObservationFollowedUp } from './observation';
import { ObservationFollowUp } from './observation-follow-up';

describe('Observation', () => {
  it('should follow-up on an observation', () => {
    const observation = Observation.from({
      id: 'obs-1',
      dateReception: new Date(),
      magistratId: 'magistrat-1',
      nominationFileId: 'file-1',
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
    });

    observation.followUpWith({
      comment: null,
      followUp: null,
      userId: 'user-id',
    });

    const [message] = observation.messages;
    expect(message).toEqual(new ObservationFollowedUp('obs-1', null, null));
  });
});
