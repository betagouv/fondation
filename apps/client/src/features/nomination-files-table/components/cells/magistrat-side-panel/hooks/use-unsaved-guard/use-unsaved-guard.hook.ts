import { useContext, useEffect, useRef, useState } from 'react';

import { SidePanelContext } from '../../context/side-panel.context';

export function useUnsavedGuard(key: string, isDirty: boolean) {
  const panel = useContext(SidePanelContext);
  const [warned, setWarned] = useState(false);

  const guardRef = useRef<() => boolean>(() => true);
  guardRef.current = () => {
    if (!isDirty) return true;
    setWarned(true);
    return false;
  };

  useEffect(() => {
    if (!panel) return;
    return panel.registerLeaveGuard(() => guardRef.current());
  }, [panel]);

  useEffect(() => {
    if (!isDirty) setWarned(false);
  }, [isDirty]);

  const showWarning = warned && isDirty;

  useEffect(() => {
    if (!panel) return;
    panel.setLeaveBlocked(key, showWarning);
    return () => panel.setLeaveBlocked(key, false);
  }, [panel, key, showWarning]);

  return showWarning;
}
