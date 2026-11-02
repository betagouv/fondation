import { type PropsWithChildren, useMemo, useState } from 'react';

import { FloatingActionsContext } from './FloatingActionsContext';

export function FloatingActionsProvider({ children }: PropsWithChildren) {
  const [stack, setStack] = useState<HTMLElement | null>(null);
  const value = useMemo(() => ({ setStack, stack }), [stack]);

  return <FloatingActionsContext value={value}>{children}</FloatingActionsContext>;
}
