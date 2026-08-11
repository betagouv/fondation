import { useQueryState } from 'nuqs';
import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';

import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { SIDE_PANEL_DOSSIER_PARAM, SidePanelContext, type SidePanelLeaveGuard } from './side-panel.context';

type PendingNext = { fromId: string; sawFetching: boolean };

export function SidePanelProvider(
  props: PropsWithChildren<{
    isFetching: boolean;
    isResolvingOutOfListFile?: boolean;
    nominationFiles: SessionNominationFile[];
    onEndReached: () => void;
    outOfListFile?: SessionNominationFile | null;
    totalCount: number;
  }>,
) {
  const { isFetching, nominationFiles, onEndReached, totalCount } = props;
  const { isResolvingOutOfListFile = false, outOfListFile = null } = props;

  const [activeId, setActiveId] = useQueryState(SIDE_PANEL_DOSSIER_PARAM);

  const [pendingNext, setPendingNext] = useState<PendingNext | null>(null);

  const leaveGuardsRef = useRef(new Set<SidePanelLeaveGuard>());
  const registerLeaveGuard = useCallback((guard: SidePanelLeaveGuard) => {
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
  const hasPrevious = localIndex > 0;
  const hasNext = localIndex !== -1 && localIndex < totalCount - 1;

  const hasResolvedFile = useRef(false);
  if (localIndex !== -1 || outOfListFile) hasResolvedFile.current = true;

  const open = useCallback(
    (id: string) => {
      if (!canLeave()) return;
      setPendingNext(null);
      setActiveId(id);
    },
    [canLeave, setActiveId],
  );

  const close = useCallback(() => {
    if (!canLeave()) return;
    setPendingNext(null);
    setActiveId(null);
  }, [canLeave, setActiveId]);

  const previous = useCallback(() => {
    if (!canLeave()) return;
    if (localIndex > 0) setActiveId(nominationFiles[localIndex - 1].id);
  }, [canLeave, localIndex, nominationFiles, setActiveId]);

  const next = useCallback(() => {
    if (!canLeave()) return;
    if (localIndex === -1) return;

    if (localIndex < nominationFiles.length - 1) {
      setActiveId(nominationFiles[localIndex + 1].id);
    } else if (hasNext) {
      setPendingNext({ fromId: nominationFiles[localIndex].id, sawFetching: false });
      onEndReached();
    }
  }, [canLeave, hasNext, localIndex, nominationFiles, onEndReached, setActiveId]);

  useEffect(() => {
    if (!pendingNext) return;

    const fromIndex = nominationFiles.findIndex((file) => file.id === pendingNext.fromId);
    const nextFile = fromIndex === -1 ? undefined : nominationFiles[fromIndex + 1];
    if (nextFile) {
      setActiveId(nextFile.id);
      setPendingNext(null);
      return;
    }

    if (isFetching) {
      if (!pendingNext.sawFetching) setPendingNext({ ...pendingNext, sawFetching: true });
    } else if (pendingNext.sawFetching) {
      setPendingNext(null);
    }
  }, [isFetching, nominationFiles, pendingNext, setActiveId]);

  useEffect(() => {
    const isUnresolvableDeepLink =
      !hasResolvedFile.current && activeId && !isFetching && !pendingNext && !isResolvingOutOfListFile;
    if (isUnresolvableDeepLink) setActiveId(null);
  }, [activeId, isFetching, isResolvingOutOfListFile, pendingNext, setActiveId]);

  const value = useMemo(
    () => ({
      activeFile: localIndex === -1 ? outOfListFile : nominationFiles[localIndex],
      activeId,
      close,
      hasNext,
      hasPrevious,
      isLeaveBlocked,
      isOpen: activeId !== null || pendingNext !== null,
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
      outOfListFile,
      pendingNext,
      previous,
      registerLeaveGuard,
      setLeaveBlocked,
    ],
  );

  return <SidePanelContext value={value}>{props.children}</SidePanelContext>;
}
