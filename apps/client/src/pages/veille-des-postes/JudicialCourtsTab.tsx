import { useOutletContext } from 'react-router';

import { JudicialCourtPresidentsTable } from '@/features/veille-des-postes/components/JudicialCourtPresidentsTable';

import type { VeilleDesPostesOutletContext } from './veille-des-postes-outlet-context.type';

export function JudicialCourtsTab() {
  const { filtersSlot, onSidePanelToggle, titleSlot } = useOutletContext<VeilleDesPostesOutletContext>();

  return (
    <JudicialCourtPresidentsTable
      filtersSlot={filtersSlot}
      onSidePanelToggle={onSidePanelToggle}
      titleSlot={titleSlot}
    />
  );
}
