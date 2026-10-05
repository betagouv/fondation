import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';

import { fileNameFromResponse, saveBlob } from '@/utils/file.utils';
import * as $api from '@api/sdk';
import type { ListedSessionAuditionsDto } from '@api/types';

export type SessionAudition = ListedSessionAuditionsDto['items'][number];

type SessionAuditionsFilters = {
  reporterIds: string[];
  search: string;
  sortBy: 'auditionDate' | null;
  sortDesc: boolean;
};

const SESSION_AUDITIONS_PAGE_SIZE = 50;

export const auditionKeys = {
  all: () => ['auditions'] as const,
  counts: (props: { sessionId: string }) => ['auditions', 'counts', props] as const,
  list: (props: { filters: SessionAuditionsFilters; sessionId: string }) =>
    ['auditions', 'list', props] as const,
};

export const useSessionAuditionsCountsQuery = (props: { sessionId: string }) =>
  useQuery({
    queryFn: async () => {
      const { data } = await $api.sessions.countSessionAuditions({ path: props, throwOnError: true });
      return data;
    },
    queryKey: auditionKeys.counts(props),
  });

export const useInfiniteSessionAuditionsQuery = (props: {
  filters: SessionAuditionsFilters;
  sessionId: string;
}) =>
  useInfiniteQuery({
    getNextPageParam: (lastPage: ListedSessionAuditionsDto | null) => lastPage?.nextPageIndex,
    initialPageParam: 1,
    placeholderData: (previous) => previous,
    queryFn: async ({ pageParam }) => {
      const { reporterIds, search, sortBy, sortDesc } = props.filters;
      const { data = null } = await $api.sessions.listSessionAuditions({
        path: { sessionId: props.sessionId },
        query: {
          limit: SESSION_AUDITIONS_PAGE_SIZE,
          page: pageParam,
          reporterIds: reporterIds.length ? reporterIds : undefined,
          search: search || undefined,
          sortBy: sortBy ?? undefined,
          sortDesc: sortDesc ? 'true' : undefined,
        },
      });
      return data;
    },
    queryKey: auditionKeys.list(props),
    select: (data) => ({
      items: data.pages.flatMap((page) => page?.items ?? []),
      totalCount: data.pages.at(-1)?.totalCount ?? 0,
    }),
  });

export const useListSessionAuditionsAsExcelMutation = () =>
  useMutation({
    mutationFn: async (props: { sessionId: string }): Promise<void> => {
      const { data, response } = await $api.sessions.listSessionAuditionsAsExcel({
        parseAs: 'blob',
        path: props,
      });
      saveBlob(data as Blob, fileNameFromResponse(response, 'auditions.xlsx'));
    },
  });
