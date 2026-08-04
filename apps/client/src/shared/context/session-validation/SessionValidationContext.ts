import { createContext } from 'react';

type SessionValidationContextType = {
  sessionToValidate: { id: string } | null;
  setSessionToValidate: (session: { id: string } | null) => void;
};

export const SessionValidationContext = createContext<SessionValidationContextType | null>(null);
