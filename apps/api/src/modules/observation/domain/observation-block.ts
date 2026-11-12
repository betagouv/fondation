import type { DateOnly } from '../../../utils/date-only';

type BlockedObservation = {
  dateReception: Date;
  fileRank: number;
  observantId: string;
  observantName: string;
  sessionId: string;
};

// a bloc gathers the observations of one observant in one session. It is placed by the reception
// date that comes first in the requested order: its most recent one when descending, its oldest
// when ascending. Inside a bloc, rows follow the nomination file order of the session
export function sortByObservationBlock<T extends BlockedObservation>(
  observations: readonly T[],
  order: 'asc' | 'desc',
): T[] {
  const direction = order === 'asc' ? 1 : -1;
  const blockKey = ({ observantId, sessionId }: T) => `${sessionId}:${observantId}`;
  const blockTimes = new Map(
    Map.groupBy(observations, blockKey)
      .entries()
      .map(([key, rows]) => {
        const times = rows.map(({ dateReception }) => dateReception.getTime());
        return [key, order === 'asc' ? Math.min(...times) : Math.max(...times)];
      }),
  );
  const blockTime = (observation: T) => blockTimes.get(blockKey(observation)) ?? 0;

  return observations.toSorted(
    (a, b) =>
      direction * (blockTime(a) - blockTime(b)) ||
      a.observantName.localeCompare(b.observantName, 'fr', { sensitivity: 'base' }) ||
      // two homonymous observants, or one observant in two sessions, stay in separate blocs,
      // in the same order on every page
      a.observantId.localeCompare(b.observantId) ||
      a.sessionId.localeCompare(b.sessionId) ||
      a.fileRank - b.fileRank,
  );
}

// the observant is proposed again after their observations: in another session published after the most
// recent reception date of the bloc
export function laterPropositions<T extends { session: { date: DateOnly; id: string } }>(
  block: { receptionDates: readonly Date[]; sessionId: string },
  propositions: readonly T[],
): T[] {
  const lastReception = Math.max(...block.receptionDates.map((date) => date.getTime()));
  return propositions.filter(
    ({ session }) => session.id !== block.sessionId && session.date.toDate().getTime() > lastReception,
  );
}

// sessions follow their date in the requested order; inside a session, the most recent blocs come first
export function sortBySessionThenObservationBlock<T extends BlockedObservation & { sessionDate: Date }>(
  observations: readonly T[],
  order: 'asc' | 'desc',
): T[] {
  const direction = order === 'asc' ? 1 : -1;

  // a stable sort keeps the bloc order inside each session
  return sortByObservationBlock(observations, 'desc').toSorted(
    (a, b) =>
      direction * (a.sessionDate.getTime() - b.sessionDate.getTime()) ||
      a.sessionId.localeCompare(b.sessionId),
  );
}
