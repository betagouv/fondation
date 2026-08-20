import { useOutletContext } from 'react-router';

import { SgSessionFilesTable } from '@/features/nomination-files-table/components/SgSessionFilesTable';

import type { TransparenceOutletContext } from './transparence-outlet-context.type';

export function TransparencePropositionsTab() {
  const { filtersSlot, transparence } = useOutletContext<TransparenceOutletContext>();

  return (
    <SgSessionFilesTable
      canManage={!transparence.isArchived}
      filtersSlot={filtersSlot}
      formation={transparence.formation}
      outcomes={transparence.outcomes}
      sessionId={transparence.id}
    />
  );
}
