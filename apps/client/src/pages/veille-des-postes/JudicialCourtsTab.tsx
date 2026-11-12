import { useOutletContext } from 'react-router';

import { JudicialCourtPresidentsTable } from '@/features/veille-des-postes/components/JudicialCourtPresidentsTable';

import type { VeilleDesPostesOutletContext } from './veille-des-postes-outlet-context.type';

export function JudicialCourtsTab() {
  const { filtersSlot, titleSlot } = useOutletContext<VeilleDesPostesOutletContext>();

  return <JudicialCourtPresidentsTable filtersSlot={filtersSlot} titleSlot={titleSlot} />;
}
