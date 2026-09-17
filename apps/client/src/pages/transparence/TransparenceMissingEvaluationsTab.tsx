import { useOutletContext } from 'react-router';

import { MissingEvaluationsTable } from '@/features/transparence/components/missing-evaluations/MissingEvaluationsTable';

import type { TransparenceOutletContext } from './transparence-outlet-context.type';

export function TransparenceMissingEvaluationsTab() {
  const { filtersSlot, isPinned, toolbarSlot, transparence } = useOutletContext<TransparenceOutletContext>();

  return (
    <MissingEvaluationsTable
      canManage={!transparence.isArchived}
      filtersSlot={filtersSlot}
      formation={transparence.formation}
      isPinned={isPinned}
      outcomes={transparence.outcomes}
      scrollsWithPage
      sessionId={transparence.id}
      toolbarSlot={toolbarSlot}
    />
  );
}
