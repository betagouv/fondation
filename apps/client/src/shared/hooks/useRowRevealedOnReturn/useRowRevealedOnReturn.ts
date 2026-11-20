import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import { useLocation } from 'react-router';

const REVEAL_MS = 2000;

type HistoryState = { usr?: { revealedRowId?: string } } | null;

// React Router keeps its state under `usr`: writing there directly spares a navigation, which would race the link
function replaceRevealedRowId(revealedRowId: string | undefined) {
  const state = window.history.state as HistoryState;
  window.history.replaceState({ ...state, usr: { ...state?.usr, revealedRowId } }, '');
}

/**
 * brings back into view and highlights, once, the row a link left from when the user comes back. Past two
 * seconds, a row loaded later is no longer revealed: the page would jump under the user's scroll
 */
export function useRowRevealedOnReturn() {
  const location = useLocation();
  const [revealedRowId, setRevealedRowId] = useState(
    (location.state as { revealedRowId?: string } | null)?.revealedRowId ?? null,
  );

  useEffect(() => {
    if (!revealedRowId) return;
    const timeout = setTimeout(() => {
      setRevealedRowId(null);
      replaceRevealedRowId(undefined);
    }, REVEAL_MS);
    return () => clearTimeout(timeout);
  }, [revealedRowId]);

  /** a link opened in another tab or window leaves this page where it is */
  const remember = useCallback((event: MouseEvent, rowId: string) => {
    if (event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
      replaceRevealedRowId(rowId);
    }
  }, []);

  return { remember, revealedRowId };
}
