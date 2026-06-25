import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';

import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { MagistratPanelContext, type MagistratPanelLeaveGuard } from './magistrat-panel.context';

type PendingEdge = { edge: 'first' | 'last'; pageIndex: number };

export function MagistratPanelProvider(
  props: PropsWithChildren<{
    isFetching: boolean;
    nominationFiles: SessionNominationFile[];
    onPageChange: (pageIndex: number) => void;
    pagination: { pageIndex: number; pageSize: number };
    totalCount: number;
  }>,
) {
  const { isFetching, nominationFiles, onPageChange, pagination, totalCount } = props;

  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingEdge | null>(null);

  const leaveGuardsRef = useRef(new Set<MagistratPanelLeaveGuard>());
  const registerLeaveGuard = useCallback((guard: MagistratPanelLeaveGuard) => {
    leaveGuardsRef.current.add(guard);
    return () => {
      leaveGuardsRef.current.delete(guard);
    };
  }, []);
  const canLeave = useCallback(() => {
    // call every guard so each edited section surfaces its own warning
    let allowed = true;
    for (const guard of leaveGuardsRef.current) if (!guard()) allowed = false;
    return allowed;
  }, []);

  const [blockedKeys, setBlockedKeys] = useState<readonly string[]>([]);
  const setLeaveBlocked = useCallback((key: string, blocked: boolean) => {
    setBlockedKeys((keys) => {
      if (blocked === keys.includes(key)) return keys;
      return blocked ? [...keys, key] : keys.filter((current) => current !== key);
    });
  }, []);
  const isLeaveBlocked = blockedKeys.length > 0;

  const localIndex = activeId ? nominationFiles.findIndex((file) => file.id === activeId) : -1;
  const globalIndex = localIndex === -1 ? -1 : pagination.pageIndex * pagination.pageSize + localIndex;
  const hasPrevious = globalIndex > 0;
  const hasNext = globalIndex !== -1 && globalIndex < totalCount - 1;

  const open = useCallback(
    (id: string) => {
      if (!canLeave()) return;
      setPending(null);
      setActiveId(id);
    },
    [canLeave],
  );

  const close = useCallback(() => {
    if (!canLeave()) return;
    setPending(null);
    setActiveId(null);
  }, [canLeave]);

  const previous = useCallback(() => {
    if (!canLeave()) return;
    if (localIndex > 0) {
      setActiveId(nominationFiles[localIndex - 1].id);
    } else if (hasPrevious) {
      setPending({ edge: 'last', pageIndex: pagination.pageIndex - 1 });
      onPageChange(pagination.pageIndex - 1);
    }
  }, [canLeave, hasPrevious, localIndex, nominationFiles, onPageChange, pagination.pageIndex]);

  const next = useCallback(() => {
    if (!canLeave()) return;
    if (localIndex !== -1 && localIndex < nominationFiles.length - 1) {
      setActiveId(nominationFiles[localIndex + 1].id);
    } else if (hasNext) {
      setPending({ edge: 'first', pageIndex: pagination.pageIndex + 1 });
      onPageChange(pagination.pageIndex + 1);
    }
  }, [canLeave, hasNext, localIndex, nominationFiles, onPageChange, pagination.pageIndex]);

  useEffect(() => {
    if (
      !pending ||
      isFetching ||
      pagination.pageIndex !== pending.pageIndex ||
      nominationFiles.length === 0
    ) {
      return;
    }
    const target =
      pending.edge === 'first' ? nominationFiles[0] : nominationFiles[nominationFiles.length - 1];
    setActiveId(target.id);
    setPending(null);
  }, [isFetching, nominationFiles, pagination.pageIndex, pending]);

  const value = useMemo(
    () => ({
      activeFile: localIndex === -1 ? null : nominationFiles[localIndex],
      activeId,
      close,
      hasNext,
      hasPrevious,
      isLeaveBlocked,
      isOpen: localIndex !== -1 || pending !== null,
      next,
      open,
      previous,
      registerLeaveGuard,
      setLeaveBlocked,
    }),
    [
      activeId,
      close,
      hasNext,
      hasPrevious,
      isLeaveBlocked,
      localIndex,
      next,
      nominationFiles,
      open,
      pending,
      previous,
      registerLeaveGuard,
      setLeaveBlocked,
    ],
  );

  return <MagistratPanelContext value={value}>{props.children}</MagistratPanelContext>;
}
