import { useOutletContext } from 'react-router';

import { CourtOfAppealFirstPresidentsTable } from '@/features/veille-des-postes/components/CourtOfAppealFirstPresidentsTable';

import type { VeilleDesPostesOutletContext } from './veille-des-postes-outlet-context.type';

export function CourtsOfAppealTab() {
  const { filtersSlot, titleSlot } = useOutletContext<VeilleDesPostesOutletContext>();

  return <CourtOfAppealFirstPresidentsTable filtersSlot={filtersSlot} titleSlot={titleSlot} />;
}
