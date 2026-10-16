import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';

import type { FormationEnum } from '@/shared/enums/formation.enum';
import * as $api from '@api/sdk';
import type { ListArchivedSessionsData, ListedArchivedNominationSessionsDto } from '@api/types';

export type ArchivedSessionsFilters = { formations?: FormationEnum[]; search?: string };
export type ArchivedSessionsSorting =
  | []
  | [{ desc: boolean; id: NonNullable<NonNullable<ListArchivedSessionsData['query']>['sortBy']> }];

export const archivedSessionKeys = {
  listArchivedGdsSessions: (props?: {
    filters: ArchivedSessionsFilters;
    sorting: ArchivedSessionsSorting;
  }) => ['archivedSessions', 'listArchivedGdsSessions', props],
};

const ARCHIVED_SESSIONS_PAGE_SIZE = 50;

/** @warning must stay stable, tanstack only reuses the selection when the function identity does not change */
function selectArchivedSessions(data: InfiniteData<ListedArchivedNominationSessionsDto | null>) {
  return {
    items: data.pages.flatMap((page) => page?.items ?? []),
    totalCount: data.pages.at(-1)?.totalCount ?? 0,
  };
}

export const useInfiniteArchivedGdsNominationSessionsQuery = (options: {
  filters: ArchivedSessionsFilters;
  sorting: ArchivedSessionsSorting;
}) =>
  useInfiniteQuery({
    getNextPageParam: (lastPage: ListedArchivedNominationSessionsDto | null) => lastPage?.nextPageIndex,
    initialPageParam: 1,
    placeholderData: (previous) => previous,
    queryFn: ({ pageParam }) =>
      $api.archivedSessions
        .listArchivedSessions({
          query: {
            formations: options.filters.formations,
            limit: ARCHIVED_SESSIONS_PAGE_SIZE,
            page: pageParam,
            search: options.filters.search || undefined,
            sortBy: options.sorting[0]?.id,
            sortDesc: options.sorting[0]?.desc ? 'true' : undefined,
          },
        })
        .then(({ data = null }) => data),
    queryKey: archivedSessionKeys.listArchivedGdsSessions(options),
    select: selectArchivedSessions,
  });
