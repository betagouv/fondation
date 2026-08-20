import { useOutletContext, useParams } from 'react-router';

import { MissingEvaluationsTable } from '@/features/transparence/components/missing-evaluations/MissingEvaluationsTable';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

import type { TransparenceOutletContext } from './transparence-outlet-context.type';

export function TransparenceMissingEvaluationsTab() {
  const { sessionId } = useParams();
  const { filtersSlot } = useOutletContext<TransparenceOutletContext>();
  const { data: transparence } = useDetailedNominationSessionQuery({
    sessionId,
  });

  if (!transparence) return null;

  return (
    <MissingEvaluationsTable
      filtersSlot={filtersSlot}
      formation={transparence.formation}
      outcomes={transparence.outcomes}
      sessionId={transparence.id}
    />
  );
}
