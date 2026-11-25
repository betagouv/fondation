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

/** the title of a holder of each position: the masculine one also names the position */
export const COURT_OF_CASSATION_POSITION_TITLES: Record<
  CourtOfCassationPosition,
  { man: string; woman: string }
> = {
  AUDITOR_FIRST_GRADE: { man: 'Auditeur 1er grade', woman: 'Auditrice 1er grade' },
  AUDITOR_SECOND_GRADE: { man: 'Auditeur 2e grade', woman: 'Auditrice 2e grade' },
  CHAMBER_PRESIDENT: { man: 'Président de chambre', woman: 'Présidente de chambre' },
  COUNSELLOR: { man: 'Conseiller', woman: 'Conseillère' },
  FIRST_PRESIDENT: { man: 'Premier président', woman: 'Première présidente' },
  REFERENDARY_COUNSELLOR: { man: 'Conseiller référendaire', woman: 'Conseillère référendaire' },
};
