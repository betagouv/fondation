import { generatePath } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { CourtOfCassationPosition } from '@queries/veille-des-postes.queries';

const SLUGS: Record<CourtOfCassationPosition, string> = {
  AUDITOR_FIRST_GRADE: 'auditeurs-1er-grade',
  AUDITOR_SECOND_GRADE: 'auditeurs-2e-grade',
  CHAMBER_PRESIDENT: 'presidents-de-chambre',
  COUNSELLOR: 'conseillers',
  FIRST_PRESIDENT: 'premier-president',
  REFERENDARY_COUNSELLOR: 'conseillers-referendaires',
};

export const FIRST_COURT_OF_CASSATION_POSITION: CourtOfCassationPosition = 'FIRST_PRESIDENT';

export function courtOfCassationPositionPath(position: CourtOfCassationPosition): string {
  return generatePath(ROUTE_PATHS.SG.CSM.VEILLE_DES_POSTES_COURT_OF_CASSATION_POSITION, {
    position: SLUGS[position],
  });
}

export function courtOfCassationPositionOf(slug: string | undefined): CourtOfCassationPosition | undefined {
  return (Object.keys(SLUGS) as CourtOfCassationPosition[]).find((position) => SLUGS[position] === slug);
}
