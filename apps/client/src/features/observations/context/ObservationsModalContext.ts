import { createContext, useContext } from 'react';

import { type Observation } from '@queries/observations.queries';

export type ActiveFile = { sessionId: string; id: string; name: string };

type ObservationsModalContextType = {
  edit: (observation: Observation, file: ActiveFile) => void;
  open: (file: ActiveFile, mode?: 'view' | 'create') => void;
  requestDelete: (observation: Observation, file: ActiveFile) => void;
};

/** @internal */
export const ObservationsModalContext = createContext<ObservationsModalContextType | null>(null);

export function useObservationsModal() {
  const ctx = useContext(ObservationsModalContext);
  if (!ctx) throw new Error('useObservationsModal must be used within ObservationsModalProvider');
  return ctx;
}
