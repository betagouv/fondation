import React from 'react';

import type { FormationEnum } from '@/types/enums.types';

export type NominationFilesTableContextType = {
  sessionId: string;
  formation: FormationEnum;
  isEditable: boolean;
  edition:
    | { isEditing: boolean; setEditing: (value: boolean | ((v: boolean) => boolean)) => void }
    | undefined;
};

export const NominationFilesTableContext = React.createContext<NominationFilesTableContextType>(
  null as unknown as NominationFilesTableContextType,
);

export function useNominationFilesTable(): NominationFilesTableContextType {
  const ctx = React.useContext(NominationFilesTableContext);
  if (!ctx) throw new Error(`Unknown NominationFilesTableContext`);

  return ctx;
}
