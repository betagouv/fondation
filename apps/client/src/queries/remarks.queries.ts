import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import type { RemarkStatusEnum } from '@/shared/enums/remark-status.enum';
import * as $api from '@api/sdk';
import type { ChangeRemarkStatusDto, ListRemarksData, ListedRemarksDto, SendRemarkDto } from '@api/types';

export type RemarksFilters = { statuses?: RemarkStatusEnum[] };
export type RemarksSorting =
  | []
  | [{ desc: boolean; id: NonNullable<NonNullable<ListRemarksData['query']>['sortBy']> }];

const remarkKeys = {
  allListRemarks: ['remarks', 'listRemarks'] as const,
  listRemarks: (props: { filters: RemarksFilters; sorting: RemarksSorting }) =>
    ['remarks', 'listRemarks', props] as const,
};

const REMARKS_PAGE_SIZE = 50;

/** @warning must stay stable, tanstack only reuses the selection when the function identity does not change */
function selectRemarks(data: InfiniteData<ListedRemarksDto | null>) {
  return {
    items: data.pages.flatMap((page) => page?.items ?? []),
    totalCount: data.pages.at(-1)?.totalCount ?? 0,
  };
}

export const useInfiniteRemarksQuery = (options: { filters: RemarksFilters; sorting: RemarksSorting }) =>
  useInfiniteQuery({
    getNextPageParam: (lastPage: ListedRemarksDto | null) => lastPage?.nextPageIndex,
    initialPageParam: 1,
    placeholderData: (previous) => previous,
    queryFn: ({ pageParam }) =>
      $api.remarks
        .listRemarks({
          query: {
            limit: REMARKS_PAGE_SIZE,
            page: pageParam,
            sortBy: options.sorting[0]?.id,
            sortDesc: options.sorting[0]?.desc ? 'true' : undefined,
            statuses: options.filters.statuses,
          },
        })
        .then(({ data }) => data ?? null),
    queryKey: remarkKeys.listRemarks(options),
    select: selectRemarks,
  });

export function useSendRemarkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (remark: SendRemarkDto) => $api.remarks.sendRemark({ body: remark, throwOnError: true }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: remarkKeys.allListRemarks }),
  });
}

export function useChangeRemarkStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ remarkId, ...change }: ChangeRemarkStatusDto & { remarkId: string }) =>
      $api.remarks.changeRemarkStatus({
        body: change,
        path: { remarkId },
        throwOnError: true,
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: remarkKeys.allListRemarks }),
  });
}
