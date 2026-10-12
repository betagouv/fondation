import { createContext, useContext } from 'react';

import type { AgendaContextType } from './AgendaContext.types';

export const AgendaContext = createContext<AgendaContextType | null>(null);
export function useAgenda(): AgendaContextType {
  const ctx = useContext(AgendaContext);
  if (!ctx) throw new Error('useAgenda must be used within AgendaProvider');

  return ctx;
}
