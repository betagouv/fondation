import { useMemo, useState, type PropsWithChildren } from 'react';

import { SessionValidationContext } from './SessionValidationContext';

export function SessionValidationProvider({ children }: PropsWithChildren) {
  const [sessionToValidate, setSessionToValidate] = useState<{ id: string } | null>(null);
  const ctx = useMemo(() => ({ sessionToValidate, setSessionToValidate }), [sessionToValidate]);

  return <SessionValidationContext value={ctx}>{children}</SessionValidationContext>;
}
