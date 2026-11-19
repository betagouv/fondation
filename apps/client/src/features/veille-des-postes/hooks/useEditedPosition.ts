import { useCallback, useEffect, useRef, useState } from 'react';

import type { EditedPosition } from '../components/PositionVacancySidePanel';
import { usePrefetchedPositionPanels } from '@queries/veille-des-postes.queries';

/**
 * the position whose status or comment the side panel edits among the rows loaded: read again from them
 * once a change refreshed them or kept as it was once a filter left it out. toEdited must keep its identity:
 * the columns are built with open. While the form tells what it lacks to be saved the panel stays on its
 * position
 */
export function useEditedPosition<Row>(
  rows: readonly Row[],
  toEdited: (row: Row) => EditedPosition | null,
  onToggle: (open: boolean) => void,
) {
  const [edited, setEdited] = useState<EditedPosition | null>(null);
  const [isLeaveBlocked, setLeaveBlocked] = useState(false);
  // read by open without changing its identity
  const isLeaveBlockedRef = useRef(isLeaveBlocked);
  isLeaveBlockedRef.current = isLeaveBlocked;
  const leave = useCallback((position: EditedPosition | null) => {
    if (!isLeaveBlockedRef.current) setEdited(position);
  }, []);
  const isOpen = edited !== null;
  useEffect(() => {
    onToggle(isOpen);
    return () => onToggle(false);
  }, [isOpen, onToggle]);
  const editable = rows.flatMap((row) => toEdited(row) ?? []);
  const index = edited ? editable.findIndex(({ id }) => id === edited.id) : -1;
  // a change can take the row out of a filtered table: its neighbours stay those around its last place
  const lastPlace = useRef<{ id: string; index: number } | null>(null);
  if (edited && index !== -1) lastPlace.current = { id: edited.id, index };
  const left = index === -1 && edited && lastPlace.current?.id === edited.id;
  const [previous, next] = left
    ? [editable[lastPlace.current!.index - 1], editable[lastPlace.current!.index]]
    : index === -1
      ? [undefined, undefined]
      : [editable[index - 1], editable[index + 1]];
  usePrefetchedPositionPanels(
    [previous, next].flatMap((position) =>
      position ? [{ commented: position.commented, magistratId: position.magistrat?.id ?? null }] : [],
    ),
  );

  return {
    close: useCallback(() => leave(null), [leave]),
    edited: editable[index] ?? edited,
    isLeaveBlocked,
    next: next ? () => leave(next) : undefined,
    open: useCallback((row: Row) => leave(toEdited(row)), [leave, toEdited]),
    previous: previous ? () => leave(previous) : undefined,
    setLeaveBlocked,
  };
}
