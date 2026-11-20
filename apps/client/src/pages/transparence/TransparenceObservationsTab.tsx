import { useOutletContext } from 'react-router';

import { SessionObservationsTable } from '@/features/observations/components/SessionObservationsTable';

import type { TransparenceOutletContext } from './transparence-outlet-context.type';

export function TransparenceObservationsTab() {
  const { filtersSlot, toolbarSlot, transparence } = useOutletContext<TransparenceOutletContext>();

  return (
    <SessionObservationsTable
      filtersSlot={filtersSlot}
      sessionId={transparence.id}
      toolbarSlot={toolbarSlot}
    />
  );
}
