import { CIVILITIES, type Civility } from '../../magistrat/domain/magistrat-name';
import { SUPERIOR_COURT_OF_APPEAL_TYPE_ID } from '../../shared/court';
import {
  COURT_OF_CASSATION_POSITION_TITLES,
  type CourtOfCassationPosition,
} from '../../shared/court-of-cassation-position.enum';

import type { HolderService } from './court-of-cassation-position';

type Titles = { man: string; woman: string };

/** LOLFI sends the civility as free text: anything but MME or M. is unknown */
export function civilityOf(lolfi: string | null): Civility | null {
  return CIVILITIES.find((civility) => civility === lolfi) ?? null;
}

function titleOf(titles: Titles, civility: Civility | null): string {
  return civility === 'MME' ? titles.woman : titles.man;
}

/** a sentence lowers the capital of a court label: "Tribunal judiciaire de Grasse" */
function inSentence(courtLabel: string): string {
  return courtLabel.charAt(0).toLowerCase() + courtLabel.slice(1);
}

export function courtOfAppealHeadTitle(holder: {
  civility: Civility | null;
  courtLabel: string;
  courtTypeId: string;
}): string {
  if (holder.courtTypeId === SUPERIOR_COURT_OF_APPEAL_TYPE_ID) return judicialCourtPresidentTitle(holder);

  const title = titleOf({ man: 'Premier président', woman: 'Première présidente' }, holder.civility);
  return `${title} de la ${inSentence(holder.courtLabel)}`;
}

export function courtOfCassationHolderTitle(holder: {
  civility: Civility | null;
  position: CourtOfCassationPosition;
  service: HolderService;
}): string {
  const title = titleOf(COURT_OF_CASSATION_POSITION_TITLES[holder.position], holder.civility);
  // the first president presides over the court: the others sit in it
  const court = holder.position === 'FIRST_PRESIDENT' ? 'de la Cour de cassation' : 'à la Cour de cassation';
  return holder.service === 'EXTRAORDINARY'
    ? `${title} en service extraordinaire ${court}`
    : `${title} ${court}`;
}

export function judicialCourtPresidentTitle(holder: {
  civility: Civility | null;
  courtLabel: string;
}): string {
  const title = titleOf({ man: 'Président', woman: 'Présidente' }, holder.civility);
  return `${title} du ${inSentence(holder.courtLabel)}`;
}
