import { useMemo, useState, type PropsWithChildren } from 'react';

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
  const [isEditing, setEditing] = useState<boolean>(false);

  const ctx = useMemo(
    () => ({
      edition: props.isEditable !== false ? { isEditing, setEditing } : undefined,
      formation: props.formation,
      isEditable: props.isEditable !== false,
      outcomes: props.outcomes,
      sessionId: props.sessionId,
    }),
    [props.formation, props.isEditable, props.outcomes, props.sessionId, isEditing],
  );

  return (
    <NominationFilesTableContext value={ctx}>
      <ExcludedJurisdictionsProvider>{props.children}</ExcludedJurisdictionsProvider>
    </NominationFilesTableContext>
  );
}
