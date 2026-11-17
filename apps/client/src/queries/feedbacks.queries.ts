import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';

import type { FeedbackAgeEnum } from '@/shared/enums/feedback-age.enum';
import type { FeedbackStatusEnum } from '@/shared/enums/feedback-status.enum';
import * as $api from '@api/sdk';
import type {
  ChangeFeedbackStatusDto,
  ListFeedbacksData,
  ListedFeedbacksDto,
  SendFeedbackDto,
} from '@api/types';

export type FeedbacksFilters = {
  search?: string;
  sentAgo?: FeedbackAgeEnum;
  statuses?: FeedbackStatusEnum[];
};
export type FeedbacksSorting =
  | []
  | [{ desc: boolean; id: NonNullable<NonNullable<ListFeedbacksData['query']>['sortBy']> }];

const feedbackKeys = {
  allListFeedbacks: ['feedbacks', 'listFeedbacks'] as const,
  // under the list, so that a change of status refreshes the counts too
  countFeedbacks: (props: { filters: FeedbacksFilters; status: FeedbackStatusEnum }) =>
    ['feedbacks', 'listFeedbacks', 'count', props] as const,
  listFeedbacks: (props: { filters: FeedbacksFilters; sorting: FeedbacksSorting }) =>
    ['feedbacks', 'listFeedbacks', props] as const,
};

const FEEDBACKS_PAGE_SIZE = 50;

/** @warning must stay stable, tanstack only reuses the selection when the function identity does not change */
function selectFeedbacks(data: InfiniteData<ListedFeedbacksDto>) {
  return {
    items: data.pages.flatMap((page) => page.items),
    totalCount: data.pages.at(-1)?.totalCount ?? 0,
  };
}

export const useInfiniteFeedbacksQuery = (options: {
  filters: FeedbacksFilters;
  sorting: FeedbacksSorting;
}) =>
  useInfiniteQuery({
    getNextPageParam: (lastPage: ListedFeedbacksDto) => lastPage.nextPageIndex,
    initialPageParam: 1,
    placeholderData: (previous) => previous,
    queryFn: ({ pageParam }) =>
      $api.feedbacks
        .listFeedbacks({
          query: {
            limit: FEEDBACKS_PAGE_SIZE,
            page: pageParam,
            search: options.filters.search || undefined,
            sentAgo: options.filters.sentAgo,
            sortBy: options.sorting[0]?.id,
            sortDesc: options.sorting[0]?.desc ? 'true' : undefined,
            statuses: options.filters.statuses,
          },
          throwOnError: true,
        })
        .then(({ data }) => data),
    queryKey: feedbackKeys.listFeedbacks(options),
    select: selectFeedbacks,
  });

export const useFeedbacksCountQuery = (options: {
  filters: Omit<FeedbacksFilters, 'statuses'>;
  status: FeedbackStatusEnum;
}) =>
  useQuery({
    placeholderData: (previous) => previous,
    queryFn: () =>
      $api.feedbacks
        .listFeedbacks({
          query: {
            limit: 1,
            search: options.filters.search || undefined,
            sentAgo: options.filters.sentAgo,
            statuses: [options.status],
          },
          throwOnError: true,
        })
        .then(({ data }) => data.totalCount),
    queryKey: feedbackKeys.countFeedbacks(options),
  });

export function useSendFeedbackMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (feedback: SendFeedbackDto) =>
      $api.feedbacks.sendFeedback({ body: feedback, throwOnError: true }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: feedbackKeys.allListFeedbacks }),
  });
}

export function useChangeFeedbackStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ feedbackId, ...change }: ChangeFeedbackStatusDto & { feedbackId: string }) =>
      $api.feedbacks.changeFeedbackStatus({
        body: change,
        path: { feedbackId },
        throwOnError: true,
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: feedbackKeys.allListFeedbacks }),
  });
}
