import { parseAsIndex, useQueryStates } from 'nuqs';

import { parseAsFilters } from '@/shared/ui/data-table';

const REPORTERS_FILTER_ID = 'reporters';

export function useMyFilesFilter(userId: string | undefined) {
  const [{ filters }, setQueryState] = useQueryStates({
    filters: parseAsFilters.withDefault([]),
    page: parseAsIndex.withDefault(0),
  });

  const reporterIds = filters.find(({ id }) => id === REPORTERS_FILTER_ID)?.value as string[] | undefined;
  const isMine = !!userId && reporterIds?.length === 1 && reporterIds[0] === userId;

  const setIsMine = (mine: boolean) => {
    const others = filters.filter(({ id }) => id !== REPORTERS_FILTER_ID);
    setQueryState({
      filters: mine && userId ? others.concat({ id: REPORTERS_FILTER_ID, value: [userId] }) : others,
      page: null,
    });
  };

  return [isMine, setIsMine] as const;
}
