import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { withValidationError } from '@/utils/validation-error';
import * as $api from '@api/sdk';
import type {
  CreateCallForApplicationsDto,
  ListCallsForApplicationsData,
  ListedCallsForApplicationsDto,
  UpdateCallForApplicationsDto,
} from '@api/types';

export type CallForApplications = ListedCallsForApplicationsDto['items'][number];
export type CallsForApplicationsPeriod = ListCallsForApplicationsData['query']['period'];
export type CallForApplicationsStatus = CallForApplications['status']['id'];
export type TargetJurisdictionType = NonNullable<CallForApplications['targetJurisdictionType']>['id'];
export type CallsForApplicationsSorting =
  | []
  | [{ desc: boolean; id: NonNullable<ListCallsForApplicationsData['query']['sortBy']> }];
type CallsForApplicationsList = {
  period: CallsForApplicationsPeriod;
  sorting: CallsForApplicationsSorting;
  statuses: CallForApplicationsStatus[];
  targetJurisdictionTypes: TargetJurisdictionType[];
  years: string[];
};

const CALLS_FOR_APPLICATIONS_PAGE_SIZE = 20;

const callsForApplicationsKeys = {
  form: () => ['callsForApplications', 'form'] as const,
  list: () => ['callsForApplications', 'list'] as const,
  listOf: (props: CallsForApplicationsList) => ['callsForApplications', 'list', props] as const,
};

/** @warning must stay stable, tanstack only reuses the selection when the function identity does not change */
function selectCallsForApplications(data: InfiniteData<ListedCallsForApplicationsDto>) {
  return {
    items: data.pages.flatMap((page) => page.items),
    totalCount: data.pages.at(-1)?.totalCount ?? 0,
    statuses: data.pages.at(-1)?.statuses ?? [],
    targetJurisdictionTypes: data.pages.at(-1)?.targetJurisdictionTypes ?? [],
    years: data.pages.at(-1)?.years ?? [],
  };
}

export function useCallsForApplicationsQuery(props: CallsForApplicationsList) {
  return useInfiniteQuery({
    initialPageParam: 1,
    // the rows stay while a filter changes rather than giving way to the loader
    placeholderData: (previous) => previous,
    queryFn: async ({ pageParam }) => {
      const { data } = await $api.callsForApplications.listCallsForApplications({
        query: {
          limit: CALLS_FOR_APPLICATIONS_PAGE_SIZE,
          page: pageParam,
          period: props.period,
          sortBy: props.sorting[0]?.id,
          sortDesc: props.sorting[0]?.desc ? 'true' : undefined,
          statuses: props.statuses,
          targetJurisdictionTypes: props.targetJurisdictionTypes,
          years: props.years,
        },
        throwOnError: true,
      });
      return data;
    },
    // after queryFn, which TypeScript reads first to infer the type of lastPage
    getNextPageParam: (lastPage) => lastPage.nextPageIndex,
    queryKey: callsForApplicationsKeys.listOf(props),
    select: selectCallsForApplications,
  });
}

export function useCallForApplicationsFormQuery() {
  return useQuery({
    queryFn: async () => {
      const { data } = await $api.callsForApplications.findCallForApplicationsForm({ throwOnError: true });
      return data;
    },
    queryKey: callsForApplicationsKeys.form(),
  });
}

export function useCreateCallForApplicationsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCallForApplicationsDto) =>
      withValidationError(async () => {
        const { data } = await $api.callsForApplications.createCallForApplications({
          body,
          throwOnError: true,
        });
        return data;
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: callsForApplicationsKeys.list() }),
  });
}

export function useUpdateCallForApplicationsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ body, callId }: { body: UpdateCallForApplicationsDto; callId: string }) =>
      withValidationError(() =>
        $api.callsForApplications.updateCallForApplications({ body, path: { callId }, throwOnError: true }),
      ),
    onSettled: () => queryClient.invalidateQueries({ queryKey: callsForApplicationsKeys.list() }),
  });
}

export function useDeleteCallForApplicationsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (callId: string) =>
      withValidationError(() =>
        $api.callsForApplications.deleteCallForApplications({ path: { callId }, throwOnError: true }),
      ),
    onSettled: () => queryClient.invalidateQueries({ queryKey: callsForApplicationsKeys.list() }),
  });
}
