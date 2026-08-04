import { useContext } from 'react';

import { SessionValidationContext } from './SessionValidationContext';

export function useSessionValidation() {
  const ctx = useContext(SessionValidationContext);
  if (!ctx) {
    throw new Error('useSessionValidation must be used within SessionValidationProvider');
  }
  return ctx;
}
