import React from 'react';

import { useLocallyStoredState } from '@/shared/hooks/useLocallyStoredState';

export type AgendaBasket = {
  fileIds: readonly string[];
  has: (id: string) => boolean;
  isEmpty: boolean;
  size: number;
  add: (ids: readonly string[]) => void;
  remove: (ids: readonly string[]) => void;
  set: (ids: readonly string[]) => void;
  clear: () => void;
};

export function useAgendaBasket(sessionId: string): AgendaBasket {
  const [state, setState, clear] = useLocallyStoredState<{ fileIds: string[] }>({
    key: `agenda-basket.${sessionId}`,
    state: { fileIds: [] },
  });

  const fileIds = state.fileIds;
  return React.useMemo<AgendaBasket>(() => {
    const ids = new Set(fileIds);
    return {
      fileIds,
      size: fileIds.length,
      isEmpty: fileIds.length === 0,
      has: (id) => ids.has(id),
      add: (toAdd) => setState({ fileIds: Array.from(new Set([...fileIds, ...toAdd])) }),
      remove: (toRemove) => {
        const removed = new Set(toRemove);
        setState({ fileIds: fileIds.filter((id) => !removed.has(id)) });
      },
      set: (next) => setState({ fileIds: Array.from(new Set(next)) }),
      clear: () => clear(),
    };
  }, [fileIds, setState, clear]);
}
