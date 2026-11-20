import { type PositionKind } from './lolfi-referential';
import { type Deciles } from './random';

export type WatchedPosition = {
  ages?: Deciles;
  holdersBeyondRetirement?: number;
  holdersCloseToSevenYears?: number;
  functionId: string;
  jurisdictionType: string;
  label: string;
  sharedSeats?: number;
  yearsOnPosition?: Deciles;
};

/* The positions of the veille des postes. Their holders are drawn as production on 2026-11-12, measured as
   docs/donnees-fictives.md tells:
   - ages and years in post follow its deciles, given for groups of at least 30 magistrats only so as to
     reveal no one, the smaller groups following those of their grade
   - it gives how many holders are beyond 67 and how many heads of court are close to the seven years after
     which they move, their ages and years in post being drawn: no value of production belongs to anyone.
     The premier président of the Cour de cassation, allowed until 68, is set beyond 67 to test that limit
   - a court has a single head, except the TJ that production leads with two presidents */
export const WATCHED_POSITIONS: readonly WatchedPosition[] = [
  { functionId: 'ACC', jurisdictionType: 'CC', label: 'Auditeur à la Cour de cassation' },
  {
    ages: [55, 62, 66],
    functionId: 'C',
    holdersBeyondRetirement: 7,
    jurisdictionType: 'CC',
    label: 'Conseiller à la Cour de cassation',
    yearsOnPosition: [1.2, 4.2, 8.2],
  },
  {
    functionId: 'C SE',
    holdersBeyondRetirement: 1,
    jurisdictionType: 'CC',
    label: 'Conseiller en service extraordinaire à la Cour de cassation',
  },
  {
    ages: [43, 47, 50],
    functionId: 'CR',
    jurisdictionType: 'CC',
    label: 'Conseiller référendaire à la Cour de cassation',
    yearsOnPosition: [1.7, 4.3, 7.2],
  },
  {
    ages: [46, 52, 61],
    functionId: 'P',
    holdersBeyondRetirement: 1,
    holdersCloseToSevenYears: 2,
    jurisdictionType: 'TJ',
    label: 'Président de tribunal judiciaire',
    sharedSeats: 1,
    yearsOnPosition: [1.5, 2.9, 4.8],
  },
  { functionId: 'PC', jurisdictionType: 'CC', label: 'Président de chambre à la Cour de cassation' },
  {
    ages: [58, 63, 65],
    functionId: 'PP',
    jurisdictionType: 'CA',
    label: "Premier président de cour d'appel",
    yearsOnPosition: [1.2, 2.9, 4.8],
  },
  {
    functionId: 'PP',
    holdersBeyondRetirement: 1,
    jurisdictionType: 'CC',
    label: 'Premier président de la Cour de cassation',
  },
];

export const WATCHED_ADMINISTRATIVE_POSITIONS = new Map([
  ['PT', 411],
  ['MAS', 3],
  ['MFO', 3],
  ['RLIM_AGE', 3],
  ['P80', 2],
  ['P50', 1],
  ['P60', 1],
  ['P70', 1],
  ['PT5', 1],
]);
export const WATCHED_DATED_SHARE = 0.87;
export const WATCHED_IN_SESSIONS = 19;
export const OLDEST_DRAWN_AGE = 66;
export const AGES_BEYOND_RETIREMENT = { max: 69, min: 67 };
/* The alert announces the seven years in post six months ahead */
export const YEARS_CLOSE_TO_SEVEN = { max: 6.8, min: 6.55 };

export function watchedPositionOf(kind: PositionKind): WatchedPosition | undefined {
  return WATCHED_POSITIONS.find(
    (position) =>
      position.functionId === kind.functionId && position.jurisdictionType === kind.jurisdictionType,
  );
}
