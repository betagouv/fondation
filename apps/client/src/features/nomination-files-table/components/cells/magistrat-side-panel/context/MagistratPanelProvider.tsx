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

  const leaveGuardRef = useRef<MagistratPanelLeaveGuard | null>(null);
  const registerLeaveGuard = useCallback((guard: MagistratPanelLeaveGuard | null) => {
    leaveGuardRef.current = guard;
  }, []);
  const canLeave = useCallback(() => (leaveGuardRef.current ? leaveGuardRef.current() : true), []);

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
      isOpen: localIndex !== -1 || pending !== null,
      next,
      open,
      previous,
      registerLeaveGuard,
    }),
    [
      activeId,
      close,
      hasNext,
      hasPrevious,
      localIndex,
      next,
      nominationFiles,
      open,
      pending,
      previous,
      registerLeaveGuard,
    ],
  );

  return <MagistratPanelContext value={value}>{props.children}</MagistratPanelContext>;
}
