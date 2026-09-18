import { useOutletContext } from 'react-router';

import { SgSessionFilesTable } from '@/features/nomination-files-table/components/SgSessionFilesTable';

import type { TransparenceOutletContext } from './transparence-outlet-context.type';

export function TransparencePropositionsTab() {
  const { filtersSlot, headerSlot, onSelectingChange, toolbarSlot, transparence } =
    useOutletContext<TransparenceOutletContext>();

  return (
    <SgSessionFilesTable
      canManage={!transparence.isArchived}
      filtersSlot={filtersSlot}
      formation={transparence.formation}
      headerSlot={headerSlot}
      onSelectingChange={onSelectingChange}
      outcomes={transparence.outcomes}
      scrollsWithPage
      sessionId={transparence.id}
      toolbarSlot={toolbarSlot}
    />
  );
}
