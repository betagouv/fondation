import type { CourtOfCassationPosition, HolderService } from './court-of-cassation-position';

type Titles = { man: string; woman: string };

const COURT_OF_CASSATION_TITLES: Record<CourtOfCassationPosition, Titles> = {
  AUDITOR_FIRST_GRADE: { man: 'Auditeur 1er grade', woman: 'Auditrice 1er grade' },
  AUDITOR_SECOND_GRADE: { man: 'Auditeur 2e grade', woman: 'Auditrice 2e grade' },
  CHAMBER_PRESIDENT: { man: 'Président de chambre', woman: 'Présidente de chambre' },
  COUNSELLOR: { man: 'Conseiller', woman: 'Conseillère' },
  FIRST_PRESIDENT: { man: 'Premier président', woman: 'Première présidente' },
  REFERENDARY_COUNSELLOR: { man: 'Conseiller référendaire', woman: 'Conseillère référendaire' },
};

/** LOLFI sends the civility as free text, MME or M. */
function titleOf(titles: Titles, civility: string | null): string {
  return civility === 'MME' ? titles.woman : titles.man;
}

/** the court labels start with a capital, "Tribunal judiciaire de Grasse", which a sentence lowers */
function inSentence(courtLabel: string): string {
  return courtLabel.charAt(0).toLowerCase() + courtLabel.slice(1);
}

export function courtOfAppealFirstPresidentTitle(holder: {
  civility: string | null;
  courtLabel: string;
}): string {
  const title = titleOf({ man: 'Premier président', woman: 'Première présidente' }, holder.civility);
  return `${title} de la ${inSentence(holder.courtLabel)}`;
}

export function courtOfCassationHolderTitle(holder: {
  civility: string | null;
  position: CourtOfCassationPosition;
  service: HolderService;
}): string {
  const title = titleOf(COURT_OF_CASSATION_TITLES[holder.position], holder.civility);
  return holder.service === 'EXTRAORDINARY'
    ? `${title} en service extraordinaire à la Cour de cassation`
    : `${title} à la Cour de cassation`;
}

export function judicialCourtPresidentTitle(holder: { civility: string | null; courtLabel: string }): string {
  const title = titleOf({ man: 'Président', woman: 'Présidente' }, holder.civility);
  return `${title} du ${inSentence(holder.courtLabel)}`;
}
