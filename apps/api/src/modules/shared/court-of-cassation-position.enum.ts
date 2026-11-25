/** the positions of the Cour de cassation from the highest to the lowest */
export const COURT_OF_CASSATION_POSITIONS = [
  'FIRST_PRESIDENT',
  'CHAMBER_PRESIDENT',
  'COUNSELLOR',
  'REFERENDARY_COUNSELLOR',
  'AUDITOR_SECOND_GRADE',
  'AUDITOR_FIRST_GRADE',
] as const;
export type CourtOfCassationPosition = (typeof COURT_OF_CASSATION_POSITIONS)[number];
