import { createContext, useContext } from 'react';

import { type Observation } from '@queries/observations.queries';

type ActiveFile = { sessionId: string; id: string; name: string };
type ModalMode = 'view' | 'create' | 'edit' | 'confirm-delete';

type ObservationsModalContextType = {
  open: (file: ActiveFile, mode?: ModalMode) => void;
  requestDelete: (observation: Observation) => void;
};

/** @internal */
export const ObservationsModalContext = createContext<ObservationsModalContextType | null>(null);

export function useObservationsModal() {
  const ctx = useContext(ObservationsModalContext);
  if (!ctx) throw new Error('useObservationsModal must be used within ObservationsModalProvider');
  return ctx;
}
