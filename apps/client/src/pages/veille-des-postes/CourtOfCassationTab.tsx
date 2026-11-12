import { useOutletContext } from 'react-router';

import { CourtOfCassationHoldersTable } from '@/features/veille-des-postes/components/CourtOfCassationHoldersTable';

import type { VeilleDesPostesOutletContext } from './veille-des-postes-outlet-context.type';

export function CourtOfCassationTab() {
  const { filtersSlot, titleSlot } = useOutletContext<VeilleDesPostesOutletContext>();

  return <CourtOfCassationHoldersTable filtersSlot={filtersSlot} titleSlot={titleSlot} />;
}
