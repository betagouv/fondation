import { COURT_OF_APPEAL_TYPE_ID, FIRST_PRESIDENT_FUNCTION_ID } from './court-of-appeal-first-president';
import { COURT_OF_CASSATION_ID, courtOfCassationPositionOf } from './court-of-cassation-position';
import { JUDICIAL_COURT_TYPE_ID, PRESIDENT_FUNCTION_ID } from './judicial-court-president';
import type { WatchedPosition } from './position-alert';

/** the position a table of the veille lists (as its query selects it): null for any other */
export function watchedPositionOf(lolfi: {
  courtTypeId: string;
  functionId: string | null;
  gradeId: string;
  jurisdictionId: string;
}): WatchedPosition | null {
  if (lolfi.jurisdictionId === COURT_OF_CASSATION_ID) return courtOfCassationPositionOf(lolfi);
  if (lolfi.courtTypeId === COURT_OF_APPEAL_TYPE_ID && lolfi.functionId === FIRST_PRESIDENT_FUNCTION_ID) {
    return 'COURT_OF_APPEAL_FIRST_PRESIDENT';
  }
  if (lolfi.courtTypeId === JUDICIAL_COURT_TYPE_ID && lolfi.functionId === PRESIDENT_FUNCTION_ID) {
    return 'JUDICIAL_COURT_PRESIDENT';
  }
  return null;
}
