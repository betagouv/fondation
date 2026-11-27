import {
  type InfiniteData,
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { withValidationError } from '@/utils/validation-error';
import * as $api from '@api/sdk';
import type {
  ListedMagistratAttachedEmailsDto,
  ListedMagistratPhoneNumbersDto,
  ListedUnrecognisedMagistratEmailsDto,
  ListUnrecognisedMagistratEmailsData,
  SearchMagistratsResponseDto,
} from '@api/types';

import { auditionKeys } from './auditions.queries';

export type MagistratPhoneNumber = ListedMagistratPhoneNumbersDto['items'][number];
export type MagistratAttachedEmail = ListedMagistratAttachedEmailsDto['items'][number];
export type FoundMagistrat = SearchMagistratsResponseDto['items'][number];
export type UnrecognisedMagistratEmail = ListedUnrecognisedMagistratEmailsDto['items'][number];
export type UnrecognisedMagistratEmailsSorting = [
  { desc: boolean; id: NonNullable<NonNullable<ListUnrecognisedMagistratEmailsData['query']>['sortBy']> },
];

export const MAGISTRAT_SEARCH_MIN_LENGTH = 2;
const UNRECOGNISED_EMAILS_PAGE_SIZE = 20;

const magistratKeys = {
  magistratAttachedEmails: (props: { magistratId: string }) => ['magistratAttachedEmails', props] as const,
  magistratDetails: (props: { magistratId: string }) => ['magistratDetails', props] as const,
  magistratNominationFiles: (props: { magistratId: string }) => ['magistratNominationFiles', props] as const,
  magistratObservations: (props: { magistratId: string }) => ['magistratObservations', props] as const,
  magistratPhoneNumbers: (props: { magistratId: string }) => ['magistratPhoneNumbers', props] as const,
  magistratSearch: (props: { ignore?: readonly string[]; search: string }) =>
    ['magistratSearch', props] as const,
  unrecognisedEmails: () => ['unrecognisedMagistratEmails'] as const,
  unrecognisedEmailsSortedBy: (sorting: UnrecognisedMagistratEmailsSorting) =>
    ['unrecognisedMagistratEmails', sorting] as const,
};

export function useMagistratDetailsQuery(props: { magistratId: string | undefined }) {
  return useQuery({
    enabled: !!props.magistratId,
    queryFn: async () => {
      const { data } = await $api.magistrats.detailMagistrat({
        path: { magistratId: props.magistratId ?? '' },
      });
      return data ?? null;
    },
    queryKey: magistratKeys.magistratDetails({ magistratId: props.magistratId ?? '' }),
  });
}

export function useMagistratSearchQuery(props: { ignore?: readonly string[]; search: string }) {
  return useInfiniteQuery({
    enabled: props.search.length >= MAGISTRAT_SEARCH_MIN_LENGTH,
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    queryFn: async ({ pageParam }) => {
      const { data } = await $api.magistrats.searchMagistrats({
        query: { ignore: props.ignore?.join(',') || undefined, page: pageParam, search: props.search },
        throwOnError: true,
      });
      return data;
    },
    // after queryFn, which TypeScript reads first to infer the type of lastPage
    getNextPageParam: (lastPage) => lastPage.nextPageIndex ?? null,
    queryKey: magistratKeys.magistratSearch(props),
  });
}

export function useMagistratNominationFilesQuery(props: { magistratId: string | undefined }) {
  return useInfiniteQuery({
    enabled: !!props.magistratId,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data } = await $api.magistrats.listMagistratNominationFiles({
        path: { magistratId: props.magistratId ?? '' },
        query: { page: pageParam },
      });
      return data ?? null;
    },
    // after queryFn, which TypeScript reads first to infer the type of lastPage
    getNextPageParam: (lastPage) => lastPage?.nextPageIndex ?? null,
    queryKey: magistratKeys.magistratNominationFiles({ magistratId: props.magistratId ?? '' }),
  });
}

export function useMagistratObservationsQuery(props: { magistratId: string | undefined }) {
  return useInfiniteQuery({
    enabled: !!props.magistratId,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data } = await $api.magistrats.listMagistratObservations({
        path: { magistratId: props.magistratId ?? '' },
        query: { page: pageParam },
      });
      return data ?? null;
    },
    // after queryFn, which TypeScript reads first to infer the type of lastPage
    getNextPageParam: (lastPage) => lastPage?.nextPageIndex ?? null,
    queryKey: magistratKeys.magistratObservations({ magistratId: props.magistratId ?? '' }),
  });
}

export function useMagistratPhoneNumbersQuery(props: { magistratId: string }) {
  return useQuery({
    queryFn: async () => {
      const { data } = await $api.magistrats.listMagistratPhoneNumbers({ path: props, throwOnError: true });
      return data.items;
    },
    queryKey: magistratKeys.magistratPhoneNumbers(props),
  });
}

export function useAddMagistratPhoneNumberMutation(props: { magistratId: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { label: string | null; number: string }) =>
      withValidationError(() => $api.magistrats.addMagistratPhoneNumber({ body, path: props })),
    // the auditions show the latest saved number of each magistrat
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: auditionKeys.all() }),
        queryClient.invalidateQueries({ queryKey: magistratKeys.magistratPhoneNumbers(props) }),
      ]),
  });
}

export function useUpdateMagistratPhoneNumberMutation(props: { magistratId: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      phoneNumberId,
      ...body
    }: {
      label: string | null;
      number: string;
      phoneNumberId: string;
    }) =>
      withValidationError(() =>
        $api.magistrats.updateMagistratPhoneNumber({ body, path: { ...props, phoneNumberId } }),
      ),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: auditionKeys.all() }),
        queryClient.invalidateQueries({ queryKey: magistratKeys.magistratPhoneNumbers(props) }),
      ]),
  });
}

export function useDeleteMagistratPhoneNumberMutation(props: { magistratId: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (phoneNumberId: string) =>
      $api.magistrats.deleteMagistratPhoneNumber({ path: { ...props, phoneNumberId } }),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: auditionKeys.all() }),
        queryClient.invalidateQueries({ queryKey: magistratKeys.magistratPhoneNumbers(props) }),
      ]),
  });
}

/** @warning must stay stable, tanstack only reuses the selection when the function identity does not change */
function selectUnrecognisedMagistratEmails(data: InfiniteData<ListedUnrecognisedMagistratEmailsDto>) {
  return data.pages.flatMap((page) => page.items);
}

export function useUnrecognisedMagistratEmailsQuery(sorting: UnrecognisedMagistratEmailsSorting) {
  return useInfiniteQuery({
    initialPageParam: 1,
    // the rows stay while the sort changes rather than giving way to the loader
    placeholderData: (previous) => previous,
    queryFn: async ({ pageParam }) => {
      const { data } = await $api.magistrats.listUnrecognisedMagistratEmails({
        query: {
          limit: UNRECOGNISED_EMAILS_PAGE_SIZE,
          page: pageParam,
          sortBy: sorting[0].id,
          sortDesc: sorting[0].desc ? 'true' : undefined,
        },
        throwOnError: true,
      });
      return data;
    },
    // after queryFn, which TypeScript reads first to infer the type of lastPage
    getNextPageParam: (lastPage) => lastPage.nextPageIndex,
    queryKey: magistratKeys.unrecognisedEmailsSortedBy(sorting),
    select: selectUnrecognisedMagistratEmails,
  });
}

/** not awaited: the callbacks of a row would wait for a refreshed list that no longer holds it */
function useInvalidatingUnrecognisedEmails() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: magistratKeys.unrecognisedEmails() });
}

export function useAttachUnrecognisedMagistratEmailMutation() {
  return useMutation({
    mutationFn: ({ id, magistratId }: { id: string; magistratId: string }) =>
      withValidationError(() =>
        $api.magistrats.attachUnrecognisedMagistratEmail({
          body: { magistratId },
          path: { id },
          throwOnError: true,
        }),
      ),
    onSettled: useInvalidatingAfterAttachment(),
  });
}

function useInvalidatingAfterAttachment() {
  const queryClient = useQueryClient();
  const invalidateUnrecognisedEmails = useInvalidatingUnrecognisedEmails();
  return (_data: unknown, _error: Error | null, variables: { magistratId: string }) => {
    invalidateUnrecognisedEmails();
    void queryClient.invalidateQueries({ queryKey: magistratKeys.magistratAttachedEmails(variables) });
  };
}

export function useMagistratAttachedEmailsQuery(props: { magistratId: string }) {
  return useQuery({
    queryFn: async () => {
      const { data } = await $api.magistrats.listMagistratAttachedEmails({
        path: { magistratId: props.magistratId },
        throwOnError: true,
      });
      return data.items;
    },
    queryKey: magistratKeys.magistratAttachedEmails(props),
  });
}

export function useDetachMagistratEmailMutation(props: { magistratId: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachedEmailId: string) =>
      withValidationError(() =>
        $api.magistrats.detachMagistratEmail({
          path: { attachedEmailId, magistratId: props.magistratId },
          throwOnError: true,
        }),
      ),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: magistratKeys.magistratAttachedEmails(props) }),
  });
}

export function useDismissUnrecognisedMagistratEmailMutation() {
  return useMutation({
    mutationFn: (id: string) =>
      withValidationError(() =>
        $api.magistrats.dismissUnrecognisedMagistratEmail({ path: { id }, throwOnError: true }),
      ),
    onSettled: useInvalidatingUnrecognisedEmails(),
  });
}
