import { useMemo, type PropsWithChildren } from 'react';

import type { FormationEnum } from '@/types/enums.types';

import { ExcludedJurisdictionsProvider } from './ExcludedJurisdictionsProvider';
import { NominationFilesTableContext, type SessionOutcome } from './files-table.context';

export function NominationFilesTableProvider(
  props: PropsWithChildren<{
    canManage?: boolean;
    formation: FormationEnum;
    outcomes: readonly SessionOutcome[];
    sessionId: string;
  }>,
) {
  const ctx = useMemo(
    () => ({
      canManage: props.canManage !== false,
      formation: props.formation,
      outcomes: props.outcomes,
      sessionId: props.sessionId,
    }),
    [props.canManage, props.formation, props.outcomes, props.sessionId],
  );

  return (
    <NominationFilesTableContext value={ctx}>
      <ExcludedJurisdictionsProvider>{props.children}</ExcludedJurisdictionsProvider>
    </NominationFilesTableContext>
  );
}
