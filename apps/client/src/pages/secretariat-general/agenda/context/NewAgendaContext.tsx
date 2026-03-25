import React from 'react';

import type { NewAgendaContextType } from './NewAgendaContext.types';

export const NewAgendaContext = React.createContext<NewAgendaContextType | null>(null);
export function useNewAgenda(): NewAgendaContextType {
  const ctx = React.useContext(NewAgendaContext);
  if (!ctx) throw new Error('useNewAgenda must be used within NewAgendaProvider');

  return ctx;
}
