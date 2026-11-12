import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';

import * as $api from '@api/sdk';
import type { ListCourtOfCassationHoldersData, ListedCourtOfCassationHoldersDto } from '@api/types';

type CourtOfCassationHoldersQuery = NonNullable<ListCourtOfCassationHoldersData['query']>;

export type CourtOfCassationHolder = ListedCourtOfCassationHoldersDto['items'][number];
export type CourtOfCassationPosition = CourtOfCassationHolder['position']['id'];
export type CourtOfCassationPositionCount = ListedCourtOfCassationHoldersDto['positions'][number];
export type PositionStatus = CourtOfCassationHolder['status']['id'];
export type PositionStatusCount = ListedCourtOfCassationHoldersDto['statuses'][number];
export type CourtOfCassationHoldersSorting =
  | []
  | [{ desc: boolean; id: NonNullable<CourtOfCassationHoldersQuery['sortBy']> }];
type CourtOfCassationHoldersList = {
  positions: CourtOfCassationPosition[];
  search: string;
  sorting: CourtOfCassationHoldersSorting;
  statuses: PositionStatus[];
};

export const COURT_OF_CASSATION_HOLDERS_PAGE_SIZE = 20;

const veilleDesPostesKeys = {
  courtOfCassationHolders: (props: CourtOfCassationHoldersList) =>
    ['veilleDesPostes', 'courtOfCassationHolders', props] as const,
};

/** @warning must stay stable, tanstack only reuses the selection when the function identity does not change */
function selectCourtOfCassationHolders(data: InfiniteData<ListedCourtOfCassationHoldersDto>) {
  return {
    items: data.pages.flatMap((page) => page.items),
    positions: data.pages.at(-1)?.positions ?? [],
    statuses: data.pages.at(-1)?.statuses ?? [],
    totalCount: data.pages.at(-1)?.totalCount ?? 0,
  };
}

export function useCourtOfCassationHoldersQuery(props: CourtOfCassationHoldersList) {
  return useInfiniteQuery({
    initialPageParam: 1,
    placeholderData: (previous) => previous,
    queryFn: async ({ pageParam }) => {
      const { data } = await $api.veilleDesPostes.listCourtOfCassationHolders({
        query: {
          limit: COURT_OF_CASSATION_HOLDERS_PAGE_SIZE,
          page: pageParam,
          positions: props.positions,
          search: props.search || undefined,
          sortBy: props.sorting[0]?.id,
          sortDesc: props.sorting[0]?.desc ? 'true' : undefined,
          statuses: props.statuses,
        },
        throwOnError: true,
      });
      return data;
    },
    // after queryFn, which TypeScript reads first to infer the type of lastPage
    getNextPageParam: (lastPage) => lastPage.nextPageIndex,
    queryKey: veilleDesPostesKeys.courtOfCassationHolders(props),
    select: selectCourtOfCassationHolders,
  });
}
