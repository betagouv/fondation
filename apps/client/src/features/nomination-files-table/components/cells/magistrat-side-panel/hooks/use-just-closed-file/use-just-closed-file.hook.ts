import { useEffect, useRef, useState } from 'react';

const STILL_SHOWN_MS = 1000;

export function useJustClosedFile(activeId: string | null) {
  const [justClosedId, setJustClosedId] = useState<string | null>(null);
  const previousId = useRef(activeId);

  useEffect(() => {
    const closedId = previousId.current;
    previousId.current = activeId;
    if (activeId || !closedId) return;

    setJustClosedId(closedId);
    const timeout = setTimeout(() => setJustClosedId(null), STILL_SHOWN_MS);
    return () => clearTimeout(timeout);
  }, [activeId]);

  return activeId ? null : justClosedId;
}
