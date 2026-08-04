import { useMemo, type PropsWithChildren } from 'react';

import type { FormationEnum } from '@/types/enums.types';

import { ExcludedJurisdictionsProvider } from './ExcludedJurisdictionsProvider';
import { NominationFilesTableContext, type SessionOutcome } from './files-table.context';

export function NominationFilesTableProvider(
  props: PropsWithChildren<{
    formation: FormationEnum;
    isEditable?: boolean;
    outcomes: readonly SessionOutcome[];
    sessionId: string;
  }>,
) {
  const ctx = useMemo(
    () => ({
      formation: props.formation,
      isEditable: props.isEditable !== false,
      outcomes: props.outcomes,
      sessionId: props.sessionId,
    }),
    [props.formation, props.isEditable, props.outcomes, props.sessionId],
  );

  return (
    <NominationFilesTableContext value={ctx}>
      <ExcludedJurisdictionsProvider>{props.children}</ExcludedJurisdictionsProvider>
    </NominationFilesTableContext>
  );
}
