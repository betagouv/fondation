import { sortByObservationBlock } from './observation-block';

const observation = (
  id: string,
  props: { date: string; fileRank: number; observantId: string; observantName?: string },
) => ({
  dateReception: new Date(props.date),
  fileRank: props.fileRank,
  id,
  observantId: props.observantId,
  observantName: props.observantName ?? props.observantId,
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
});
