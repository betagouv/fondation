import { useQueryState } from 'nuqs';
import { useEffect } from 'react';

import { SIDE_PANEL_DOSSIER_PARAM } from '../../context/side-panel.context';
import {
  useSessionNominationFileQuery,
  type SessionNominationFile,
} from '@queries/nomination-sessions.queries';

export function useOutOfListFile(params: {
  fetchNextPage: () => void;
  isFiltered: boolean;
  isListPending: boolean;
  nominationFiles: readonly SessionNominationFile[];
  sessionId: string;
}): { file: SessionNominationFile | null; isResolving: boolean } {
  const { fetchNextPage, isFiltered, isListPending, nominationFiles } = params;

  const [activeId] = useQueryState(SIDE_PANEL_DOSSIER_PARAM);
  const isInList = !!activeId && nominationFiles.some(({ id }) => id === activeId);
  const isOutOfList = !!activeId && !isInList;

  const { data, isFetching } = useSessionNominationFileQuery({
    enabled: isOutOfList && !isListPending,
    nominationFileId: activeId ?? undefined,
    sessionId: params.sessionId,
  });

  const file = isOutOfList ? (data ?? null) : null;
  const willAppearInList = !!file && !isFiltered;

  useEffect(() => {
    if (willAppearInList) fetchNextPage();
  }, [fetchNextPage, nominationFiles.length, willAppearInList]);

  return { file, isResolving: isOutOfList && (isFetching || isListPending) };
}
