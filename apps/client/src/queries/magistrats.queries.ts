import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { withValidationError } from '@/utils/validation-error';
import * as $api from '@api/sdk';
import type { ListedMagistratPhoneNumbersDto, SearchMagistratsResponseDto } from '@api/types';

import { auditionKeys } from './auditions.queries';

export type MagistratPhoneNumber = ListedMagistratPhoneNumbersDto['items'][number];
export type FoundMagistrat = SearchMagistratsResponseDto['items'][number];

export const MAGISTRAT_SEARCH_MIN_LENGTH = 2;

const magistratKeys = {
  magistratDetails: (props: { magistratId: string }) => ['magistratDetails', props] as const,
  magistratNominationFiles: (props: { magistratId: string }) => ['magistratNominationFiles', props] as const,
  magistratObservations: (props: { magistratId: string }) => ['magistratObservations', props] as const,
  magistratPhoneNumbers: (props: { magistratId: string }) => ['magistratPhoneNumbers', props] as const,
  magistratSearch: (props: { search: string }) => ['magistratSearch', props] as const,
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

export function useMagistratSearchQuery(props: { search: string }) {
  return useInfiniteQuery({
    enabled: props.search.length >= MAGISTRAT_SEARCH_MIN_LENGTH,
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    queryFn: async ({ pageParam }) => {
      const { data } = await $api.magistrats.searchMagistrats({
        query: { page: pageParam, search: props.search },
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
    onSuccess: () =>
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
    onSuccess: () =>
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
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: auditionKeys.all() }),
        queryClient.invalidateQueries({ queryKey: magistratKeys.magistratPhoneNumbers(props) }),
      ]),
  });
}
