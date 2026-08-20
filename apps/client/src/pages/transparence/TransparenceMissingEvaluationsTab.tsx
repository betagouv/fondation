import { useOutletContext } from 'react-router';

import { MissingEvaluationsTable } from '@/features/transparence/components/missing-evaluations/MissingEvaluationsTable';

import type { TransparenceOutletContext } from './transparence-outlet-context.type';

export function TransparenceMissingEvaluationsTab() {
  const { filtersSlot, transparence } = useOutletContext<TransparenceOutletContext>();

  return (
    <MissingEvaluationsTable
      canManage={!transparence.isArchived}
      filtersSlot={filtersSlot}
      formation={transparence.formation}
      outcomes={transparence.outcomes}
      sessionId={transparence.id}
    />
  );
}
