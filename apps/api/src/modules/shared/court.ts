export const COURT_OF_APPEAL_TYPE_ID = 'CA';

/** a tribunal supérieur d'appel stands for the court of appeal in Saint-Pierre-et-Miquelon: a president heads it */
export const SUPERIOR_COURT_OF_APPEAL_TYPE_ID = 'TSA';

export const COURT_OF_APPEAL_TYPE_IDS: readonly string[] = [
  COURT_OF_APPEAL_TYPE_ID,
  SUPERIOR_COURT_OF_APPEAL_TYPE_ID,
];

/** a tribunal de première instance stands for the tribunal judiciaire in New Caledonia, Wallis-et-Futuna,
 * French Polynesia and Saint-Pierre-et-Miquelon */
export const JUDICIAL_COURT_TYPE_IDS: readonly string[] = ['TJ', 'TPI'];

/** the courts whose head the CSM proposes: the veille lists them and a specific call targets them */
export const HEADED_BY_CSM_COURT_TYPE_IDS: readonly string[] = [
  ...COURT_OF_APPEAL_TYPE_IDS,
  ...JUDICIAL_COURT_TYPE_IDS,
];

export function isRemovedCourt(dateSuppression: Date | null, now: Date): boolean {
  return dateSuppression !== null && dateSuppression <= now;
}

/** a court the veille lists and a specific call may target until it is removed */
export function isOpenCourtHeadedByCsm(
  court: { dateSuppression: Date | null; typeJur: string },
  now: Date,
): boolean {
  return !isRemovedCourt(court.dateSuppression, now) && HEADED_BY_CSM_COURT_TYPE_IDS.includes(court.typeJur);
}
