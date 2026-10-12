import { createContext, useContext } from 'react';

import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

type NominationFileTargetPositionContextType = {
  open: (nominationFile: SessionNominationFile) => void;
};

/** @internal */
export const NominationFileTargetPositionContext =
  createContext<NominationFileTargetPositionContextType | null>(null);

export function useNominationFileTargetPositionModal() {
  const context = useContext(NominationFileTargetPositionContext);
  if (!context)
    throw new Error(
      'useNominationFileTargetPositionModal must be used within NominationFileTargetPositionProvider',
    );

  return context;
}
