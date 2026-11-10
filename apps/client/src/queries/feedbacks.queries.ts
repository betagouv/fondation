import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import type { FeedbackStatusEnum } from '@/shared/enums/feedback-status.enum';
import * as $api from '@api/sdk';
import type {
  ChangeFeedbackStatusDto,
  ListFeedbacksData,
  ListedFeedbacksDto,
  SendFeedbackDto,
} from '@api/types';

export type FeedbacksFilters = { statuses?: FeedbackStatusEnum[] };
export type FeedbacksSorting =
  | []
  | [{ desc: boolean; id: NonNullable<NonNullable<ListFeedbacksData['query']>['sortBy']> }];

const feedbackKeys = {
  allListFeedbacks: ['feedbacks', 'listFeedbacks'] as const,
  listFeedbacks: (props: { filters: FeedbacksFilters; sorting: FeedbacksSorting }) =>
    ['feedbacks', 'listFeedbacks', props] as const,
};

const FEEDBACKS_PAGE_SIZE = 50;

/** @warning must stay stable, tanstack only reuses the selection when the function identity does not change */
function selectFeedbacks(data: InfiniteData<ListedFeedbacksDto | null>) {
  return {
    items: data.pages.flatMap((page) => page?.items ?? []),
    totalCount: data.pages.at(-1)?.totalCount ?? 0,
  };
}

export const useInfiniteFeedbacksQuery = (options: {
  filters: FeedbacksFilters;
  sorting: FeedbacksSorting;
}) =>
  useInfiniteQuery({
    getNextPageParam: (lastPage: ListedFeedbacksDto | null) => lastPage?.nextPageIndex,
    initialPageParam: 1,
    placeholderData: (previous) => previous,
    queryFn: ({ pageParam }) =>
      $api.feedbacks
        .listFeedbacks({
          query: {
            limit: FEEDBACKS_PAGE_SIZE,
            page: pageParam,
            sortBy: options.sorting[0]?.id,
            sortDesc: options.sorting[0]?.desc ? 'true' : undefined,
            statuses: options.filters.statuses,
          },
        })
        .then(({ data }) => data ?? null),
    queryKey: feedbackKeys.listFeedbacks(options),
    select: selectFeedbacks,
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
