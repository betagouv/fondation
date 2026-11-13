import { DateOnly } from '../../../utils/date-only';

import {
  laterPropositions,
  ObservationBlock,
  ObservationBlockTracked,
  sortByObservationBlock,
  sortBySessionThenObservationBlock,
} from './observation-block';

const observation = (
  id: string,
  props: {
    date: string;
    fileRank: number;
    observantId: string;
    observantName?: string;
    sessionDate?: string;
    sessionId?: string;
  },
) => ({
  dateReception: new Date(props.date),
  fileRank: props.fileRank,
  id,
  observantId: props.observantId,
  observantName: props.observantName ?? props.observantId,
  sessionDate: new Date(props.sessionDate ?? '2026-04-01'),
  sessionId: props.sessionId ?? 'session',
});

const ids = (observations: readonly { id: string }[]) => observations.map(({ id }) => id);

describe('sortByObservationBlock', () => {
  // Martin observed early and late, Durand in between: Martin's bloc comes first in both orders,
  // and would come second if the bloc date were the wrong end of its range
  const observations = [
    observation('martin-late', { date: '2026-03-10', fileRank: 0, observantId: 'Martin' }),
    observation('durand', { date: '2026-03-05', fileRank: 1, observantId: 'Durand' }),
    observation('martin-early', { date: '2026-03-01', fileRank: 2, observantId: 'Martin' }),
  ];

  it('places each bloc by its most recent reception date when descending', () => {
    expect(ids(sortByObservationBlock(observations, 'desc'))).toEqual([
      'martin-late',
      'martin-early',
      'durand',
    ]);
  });

  it('places each bloc by its oldest reception date when ascending', () => {
    expect(ids(sortByObservationBlock(observations, 'asc'))).toEqual([
      'martin-late',
      'martin-early',
      'durand',
    ]);
  });

  it('orders the rows of a bloc by nomination file, whatever their reception date', () => {
    const sorted = sortByObservationBlock(
      [
        observation('second-file', { date: '2026-03-10', fileRank: 1, observantId: 'Martin' }),
        observation('first-file', { date: '2026-03-01', fileRank: 0, observantId: 'Martin' }),
      ],
      'desc',
    );

    expect(ids(sorted)).toEqual(['first-file', 'second-file']);
  });

  it('breaks a tie on the bloc date by observant name, ignoring accents and case', () => {
    const sorted = sortByObservationBlock(
      [
        observation('fabre', { date: '2026-03-01', fileRank: 0, observantId: 'Fabre' }),
        observation('emile', { date: '2026-03-01', fileRank: 1, observantId: 'émile' }),
      ],
      'desc',
    );

    expect(ids(sorted)).toEqual(['emile', 'fabre']);
  });

  it('keeps the blocs of two homonymous observants apart', () => {
    const sorted = sortByObservationBlock(
      [
        observation('first-a', {
          date: '2026-03-01',
          fileRank: 0,
          observantId: 'a',
          observantName: 'Martin',
        }),
        observation('b', { date: '2026-03-01', fileRank: 1, observantId: 'b', observantName: 'Martin' }),
        observation('second-a', {
          date: '2026-03-01',
          fileRank: 2,
          observantId: 'a',
          observantName: 'Martin',
        }),
      ],
      'desc',
    );

    expect(ids(sorted)).toEqual(['first-a', 'second-a', 'b']);
  });

  it('splits the observations of one observant into a bloc per session', () => {
    const sorted = sortByObservationBlock(
      [
        observation('june-late', {
          date: '2026-03-10',
          fileRank: 0,
          observantId: 'Martin',
          sessionId: 'june',
        }),
        observation('march', { date: '2026-03-05', fileRank: 1, observantId: 'Martin', sessionId: 'march' }),
        observation('june-early', {
          date: '2026-03-01',
          fileRank: 2,
          observantId: 'Martin',
          sessionId: 'june',
        }),
      ],
      'desc',
    );

    expect(ids(sorted)).toEqual(['june-late', 'june-early', 'march']);
  });
});

describe('sortBySessionThenObservationBlock', () => {
  // the march session holds the most recent observation: the session date still decides
  const observations = [
    observation('march', {
      date: '2026-03-20',
      fileRank: 0,
      observantId: 'Martin',
      sessionDate: '2026-03-01',
      sessionId: 'march',
    }),
    observation('june-durand', {
      date: '2026-03-05',
      fileRank: 1,
      observantId: 'Durand',
      sessionDate: '2026-06-01',
      sessionId: 'june',
    }),
    observation('june-martin', {
      date: '2026-03-10',
      fileRank: 2,
      observantId: 'Martin',
      sessionDate: '2026-06-01',
      sessionId: 'june',
    }),
  ];

  it('places the most recent session first, then its most recent blocs, when descending', () => {
    expect(
      ids(sortBySessionThenObservationBlock(observations, { blocks: 'desc', sessions: 'desc' })),
    ).toEqual(['june-martin', 'june-durand', 'march']);
  });

  it('places the oldest session first but keeps its most recent blocs first, when ascending', () => {
    expect(ids(sortBySessionThenObservationBlock(observations, { blocks: 'desc', sessions: 'asc' }))).toEqual(
      ['march', 'june-martin', 'june-durand'],
    );
  });

  it('keeps the blocs inside their session when sorted by reception date, oldest first', () => {
    expect(ids(sortBySessionThenObservationBlock(observations, { blocks: 'asc', sessions: 'asc' }))).toEqual([
      'march',
      'june-durand',
      'june-martin',
    ]);
  });
});

describe('laterPropositions', () => {
  const proposition = (id: string, session: { date: string; id?: string }) => ({
    id,
    session: { date: DateOnly.fromUtcDate(new Date(session.date)), id: session.id ?? id },
  });
  const block = { lastReception: new Date('2026-03-10'), sessionId: 'observed' };

  it('keeps the propositions of sessions published after the most recent reception of the bloc', () => {
    const propositions = [
      proposition('before', { date: '2026-03-07' }),
      proposition('same-day', { date: '2026-03-10' }),
      proposition('after', { date: '2026-03-11' }),
    ];

    expect(ids(laterPropositions(block, propositions))).toEqual(['after']);
  });

  it('leaves out a proposition in the session of the bloc itself', () => {
    const propositions = [proposition('own', { date: '2026-04-01', id: 'observed' })];

    expect(laterPropositions(block, propositions)).toEqual([]);
  });
});

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
