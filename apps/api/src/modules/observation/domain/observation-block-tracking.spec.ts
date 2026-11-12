import { ObservationBlock, ObservationBlockTracked } from './observation-block-tracking';

describe('ObservationBlock', () => {
  const block = () => ObservationBlock.from({ magistratId: 'magistrat-1', sessionId: 'session-1' });

  it('tracks the bloc with its status and a trimmed comment', () => {
    const tracked = block();

    tracked.track({ comment: '  Proposé en juin  ', status: 'DONE' });

    expect(tracked.messages).toEqual([
      new ObservationBlockTracked('session-1', 'magistrat-1', 'DONE', 'Proposé en juin'),
    ]);
  });

  it('records a blank comment as none', () => {
    const tracked = block();

    tracked.track({ comment: '   ', status: 'IN_PROGRESS' });

    expect(tracked.messages).toEqual([
      new ObservationBlockTracked('session-1', 'magistrat-1', 'IN_PROGRESS', null),
    ]);
  });
});
