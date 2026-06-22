import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { MagistratPanelContext } from './magistrat-panel.context';

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

  const localIndex = activeId ? nominationFiles.findIndex((file) => file.id === activeId) : -1;
  const globalIndex = localIndex === -1 ? -1 : pagination.pageIndex * pagination.pageSize + localIndex;
  const hasPrevious = globalIndex > 0;
  const hasNext = globalIndex !== -1 && globalIndex < totalCount - 1;

  const open = useCallback((id: string) => {
    setPending(null);
    setActiveId(id);
  }, []);
  const close = useCallback(() => {
    setPending(null);
    setActiveId(null);
  }, []);

  const previous = useCallback(() => {
    if (localIndex > 0) {
      setActiveId(nominationFiles[localIndex - 1].id);
    } else if (hasPrevious) {
      setPending({ edge: 'last', pageIndex: pagination.pageIndex - 1 });
      onPageChange(pagination.pageIndex - 1);
    }
  }, [localIndex, nominationFiles, hasPrevious, pagination.pageIndex, onPageChange]);

  const next = useCallback(() => {
    if (localIndex !== -1 && localIndex < nominationFiles.length - 1) {
      setActiveId(nominationFiles[localIndex + 1].id);
    } else if (hasNext) {
      setPending({ edge: 'first', pageIndex: pagination.pageIndex + 1 });
      onPageChange(pagination.pageIndex + 1);
    }
  }, [localIndex, nominationFiles, hasNext, pagination.pageIndex, onPageChange]);

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
  }, [pending, isFetching, pagination.pageIndex, nominationFiles]);

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
    }),
    [localIndex, nominationFiles, activeId, close, hasNext, hasPrevious, pending, next, open, previous],
  );

  return <MagistratPanelContext value={value}>{props.children}</MagistratPanelContext>;
}
