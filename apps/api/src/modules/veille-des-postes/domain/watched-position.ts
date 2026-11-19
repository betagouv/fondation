import { COURT_OF_APPEAL_HEADS } from './court-of-appeal-first-president';
import { COURT_OF_CASSATION_ID, courtOfCassationPositionOf } from './court-of-cassation-position';
import { JUDICIAL_COURT_TYPE_IDS, PRESIDENT_FUNCTION_ID } from './judicial-court-president';
import type { WatchedPosition } from './position-alert';

/** the position a table of the veille lists (as its query selects it): null for any other */
export function watchedPositionOf(lolfi: {
  courtTypeId: string;
  functionId: string | null;
  gradeId: string;
  jurisdictionId: string;
}): WatchedPosition | null {
  if (lolfi.jurisdictionId === COURT_OF_CASSATION_ID) return courtOfCassationPositionOf(lolfi);
  const headsCourtOfAppeal = COURT_OF_APPEAL_HEADS.some(
    (head) => head.jurisdictionTypeId === lolfi.courtTypeId && head.functionId === lolfi.functionId,
  );
  if (headsCourtOfAppeal) {
    return 'COURT_OF_APPEAL_FIRST_PRESIDENT';
  }
  if (JUDICIAL_COURT_TYPE_IDS.includes(lolfi.courtTypeId) && lolfi.functionId === PRESIDENT_FUNCTION_ID) {
    return 'JUDICIAL_COURT_PRESIDENT';
  }
  return null;
}

/** a court whose head a table lists */
export function isWatchedCourt(courtTypeId: string): boolean {
  return (
    COURT_OF_APPEAL_HEADS.some((head) => head.jurisdictionTypeId === courtTypeId) ||
    JUDICIAL_COURT_TYPE_IDS.includes(courtTypeId)
  );
}

export function isRemovedCourt(dateSuppression: Date | null, now: Date): boolean {
  return dateSuppression !== null && dateSuppression <= now;
}
