import { useOutletContext } from 'react-router';

import { SessionAuditionsTable } from '@/features/transparence/components/auditions/SessionAuditionsTable';

import type { TransparenceOutletContext } from './transparence-outlet-context.type';

export function TransparenceAuditionsTab() {
  const { filtersSlot, toolbarSlot, transparence } = useOutletContext<TransparenceOutletContext>();

  return (
    <SessionAuditionsTable
      canManage={!transparence.isArchived}
      filtersSlot={filtersSlot}
      formation={transparence.formation}
      outcomes={transparence.outcomes}
      sessionId={transparence.id}
      toolbarSlot={toolbarSlot}
    />
  );
}
