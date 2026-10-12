import { createContext, useContext } from 'react';

import type { FormationEnum } from '@/shared/enums/formation.enum';
import type { DetailedNominationSessionDto } from '@api/types';

export type SessionOutcome = DetailedNominationSessionDto['outcomes'][number];

type NominationFilesTableContextType = {
  canManage: boolean;
  formation: FormationEnum;
  outcomes: readonly SessionOutcome[];
  sessionId: string;
};

export const NominationFilesTableContext = createContext<NominationFilesTableContextType>(
  null as unknown as NominationFilesTableContextType,
);

export function useNominationFilesTable(): NominationFilesTableContextType {
  const ctx = useContext(NominationFilesTableContext);
  if (!ctx) throw new Error(`Unknown NominationFilesTableContext`);

  return ctx;
}
