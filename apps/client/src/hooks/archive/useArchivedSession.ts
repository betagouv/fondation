import { useContext } from 'react';

import { ArchivedSessionContext } from './ArchivedSessionContext';

export function useArchivedSession() {
  const ctx = useContext(ArchivedSessionContext);
  if (!ctx) {
    throw new Error('useArchivedSession must be used within ArchivedSessionProvider');
  }
  return ctx;
}
