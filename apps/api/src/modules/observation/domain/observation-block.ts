type BlockedObservation = {
  dateReception: Date;
  fileRank: number;
  observantId: string;
  observantName: string;
};

// a bloc gathers the observations of one observant in one session. It is placed by the reception
// date that comes first in the requested order: its most recent one when descending, its oldest
// when ascending. Inside a bloc, rows follow the nomination file order of the session
export function sortByObservationBlock<T extends BlockedObservation>(
  observations: readonly T[],
  order: 'asc' | 'desc',
): T[] {
  const direction = order === 'asc' ? 1 : -1;
  const blockTimes = new Map(
    Map.groupBy(observations, ({ observantId }) => observantId)
      .entries()
      .map(([observantId, rows]) => {
        const times = rows.map(({ dateReception }) => dateReception.getTime());
        return [observantId, order === 'asc' ? Math.min(...times) : Math.max(...times)];
      }),
  );
  const blockTime = ({ observantId }: T) => blockTimes.get(observantId) ?? 0;

  return observations.toSorted(
    (a, b) =>
      direction * (blockTime(a) - blockTime(b)) ||
      a.observantName.localeCompare(b.observantName, 'fr', { sensitivity: 'base' }) ||
      // two homonymous observants stay in separate blocs, in the same order on every page
      a.observantId.localeCompare(b.observantId) ||
      a.fileRank - b.fileRank,
  );
}
