import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';

import * as $api from '@api/sdk';
import type {
  ListCourtOfAppealFirstPresidentsData,
  ListCourtOfCassationHoldersData,
  ListedCourtOfAppealFirstPresidentsDto,
  ListedCourtOfCassationHoldersDto,
} from '@api/types';

type CourtOfAppealFirstPresidentsQuery = NonNullable<ListCourtOfAppealFirstPresidentsData['query']>;
type CourtOfCassationHoldersQuery = NonNullable<ListCourtOfCassationHoldersData['query']>;

export type CourtOfAppealFirstPresident = ListedCourtOfAppealFirstPresidentsDto['items'][number];
export type CourtOfAppealFirstPresidentsSorting =
  | []
  | [{ desc: boolean; id: NonNullable<CourtOfAppealFirstPresidentsQuery['sortBy']> }];
type CourtOfAppealFirstPresidentsList = {
  search: string;
  sorting: CourtOfAppealFirstPresidentsSorting;
  statuses: PositionStatus[];
};

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

export const COURT_OF_APPEAL_FIRST_PRESIDENTS_DEFAULT_SORTING: CourtOfAppealFirstPresidentsSorting = [
  { desc: false, id: 'court' },
];
export const COURT_OF_APPEAL_FIRST_PRESIDENTS_PAGE_SIZE = 20;
export const COURT_OF_CASSATION_HOLDERS_DEFAULT_SORTING: CourtOfCassationHoldersSorting = [
  { desc: false, id: 'name' },
];
export const COURT_OF_CASSATION_HOLDERS_PAGE_SIZE = 20;

const veilleDesPostesKeys = {
  courtOfAppealFirstPresidents: (props: CourtOfAppealFirstPresidentsList) =>
    ['veilleDesPostes', 'courtOfAppealFirstPresidents', props] as const,
  courtOfCassationHolders: (props: CourtOfCassationHoldersList) =>
    ['veilleDesPostes', 'courtOfCassationHolders', props] as const,
};

/** @warning must stay stable, tanstack only reuses the selection when the function identity does not change */
function selectCourtOfAppealFirstPresidents(data: InfiniteData<ListedCourtOfAppealFirstPresidentsDto>) {
  return {
    items: data.pages.flatMap((page) => page.items),
    statuses: data.pages.at(-1)?.statuses ?? [],
    totalCount: data.pages.at(-1)?.totalCount ?? 0,
  };
}

/** @warning must stay stable, tanstack only reuses the selection when the function identity does not change */
function selectCourtOfCassationHolders(data: InfiniteData<ListedCourtOfCassationHoldersDto>) {
  return {
    items: data.pages.flatMap((page) => page.items),
    positions: data.pages.at(-1)?.positions ?? [],
    statuses: data.pages.at(-1)?.statuses ?? [],
    totalCount: data.pages.at(-1)?.totalCount ?? 0,
  };
}

/** the same as the unfiltered table, so that both share one request */
export function useCourtOfAppealFirstPresidentsCountQuery() {
  const { data } = useCourtOfAppealFirstPresidentsQuery({
    search: '',
    sorting: COURT_OF_APPEAL_FIRST_PRESIDENTS_DEFAULT_SORTING,
    statuses: [],
  });
  return data?.totalCount;
}

export function useCourtOfAppealFirstPresidentsQuery(props: CourtOfAppealFirstPresidentsList) {
  return useInfiniteQuery({
    initialPageParam: 1,
    placeholderData: (previous) => previous,
    queryFn: async ({ pageParam }) => {
      const { data } = await $api.veilleDesPostes.listCourtOfAppealFirstPresidents({
        query: {
          limit: COURT_OF_APPEAL_FIRST_PRESIDENTS_PAGE_SIZE,
          page: pageParam,
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
    queryKey: veilleDesPostesKeys.courtOfAppealFirstPresidents(props),
    select: selectCourtOfAppealFirstPresidents,
  });
}

/** the same as the unfiltered table, so that both share one request */
export function useCourtOfCassationHoldersCountQuery() {
  const { data } = useCourtOfCassationHoldersQuery({
    positions: [],
    search: '',
    sorting: COURT_OF_CASSATION_HOLDERS_DEFAULT_SORTING,
    statuses: [],
  });
  return data?.totalCount;
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
