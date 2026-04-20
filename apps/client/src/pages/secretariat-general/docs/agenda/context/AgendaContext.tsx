import React from 'react';

import type { AgendaContextType } from './AgendaContext.types';

export const AgendaContext = React.createContext<AgendaContextType | null>(null);
export function useAgenda(): AgendaContextType {
  const ctx = React.useContext(AgendaContext);
  if (!ctx) throw new Error('useAgenda must be used within AgendaProvider');

  return ctx;
}
