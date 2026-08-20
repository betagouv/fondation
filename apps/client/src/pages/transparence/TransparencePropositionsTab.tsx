import { useOutletContext, useParams } from 'react-router';

import { SgSessionFilesTable } from '@/features/nomination-files-table/components/SgSessionFilesTable';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

import type { TransparenceOutletContext } from './transparence-outlet-context.type';

export function TransparencePropositionsTab() {
  const { sessionId } = useParams();
  const { filtersSlot } = useOutletContext<TransparenceOutletContext>();
  const { data: transparence } = useDetailedNominationSessionQuery({
    sessionId,
  });

  if (!transparence) return null;

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
