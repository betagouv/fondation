import { useContext, useEffect, useRef } from 'react';

import { MagistratPanelContext } from '../context/magistrat-panel.context';

export function useUnsavedGuard(isDirty: boolean, onBlocked: () => void) {
  const panel = useContext(MagistratPanelContext);

  const guardRef = useRef<() => boolean>(() => true);
  guardRef.current = () => {
    if (!isDirty) return true;
    onBlocked();
    return false;
  };

  useEffect(() => {
    if (!panel) return;
    panel.registerLeaveGuard(() => guardRef.current());
    return () => panel.registerLeaveGuard(null);
  }, [panel]);
}
