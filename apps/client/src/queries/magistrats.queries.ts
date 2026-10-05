import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { HttpException } from '@/utils/http-exception';
import * as $api from '@api/sdk';
import type { ListedMagistratPhoneNumbersDto } from '@api/types';

import { auditionKeys } from './auditions.queries';

export type MagistratPhoneNumber = ListedMagistratPhoneNumbersDto['items'][number];

const magistratKeys = {
  magistratDetails: (props: { magistratId: string }) => ['magistratDetails', props] as const,
  magistratNominationFiles: (props: { magistratId: string }) => ['magistratNominationFiles', props] as const,
  magistratObservations: (props: { magistratId: string }) => ['magistratObservations', props] as const,
  magistratPhoneNumbers: (props: { magistratId: string }) => ['magistratPhoneNumbers', props] as const,
};

export function useMagistratDetailsQuery(props: { magistratId: string | undefined }) {
  return useQuery({
    enabled: !!props.magistratId,
    queryKey: magistratKeys.magistratDetails({ magistratId: props.magistratId ?? '' }),
    queryFn: async () => {
      const { data } = await $api.magistrats.detailMagistrat({
        path: { magistratId: props.magistratId ?? '' },
      });
      return data ?? null;
    },
  });
}

export function useMagistratNominationFilesQuery(props: { magistratId: string | undefined }) {
  return useInfiniteQuery({
    enabled: !!props.magistratId,
    queryKey: magistratKeys.magistratNominationFiles({ magistratId: props.magistratId ?? '' }),
    queryFn: async ({ pageParam }) => {
      const { data } = await $api.magistrats.listMagistratNominationFiles({
        path: { magistratId: props.magistratId ?? '' },
        query: { page: pageParam },
      });
      return data ?? null;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage?.nextPageIndex ?? null,
  });
}

export function useMagistratObservationsQuery(props: { magistratId: string | undefined }) {
  return useInfiniteQuery({
    enabled: !!props.magistratId,
    queryKey: magistratKeys.magistratObservations({ magistratId: props.magistratId ?? '' }),
    queryFn: async ({ pageParam }) => {
      const { data } = await $api.magistrats.listMagistratObservations({
        path: { magistratId: props.magistratId ?? '' },
        query: { page: pageParam },
      });
      return data ?? null;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage?.nextPageIndex ?? null,
  });
}

export function useMagistratPhoneNumbersQuery(props: { magistratId: string }) {
  return useQuery({
    queryKey: magistratKeys.magistratPhoneNumbers(props),
    queryFn: async () => {
      const { data } = await $api.magistrats.listMagistratPhoneNumbers({ path: props, throwOnError: true });
      return data.items;
    },
  });
}

export class ValidationError extends Error {}

async function withValidationError<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof HttpException && [400, 409].includes(error.statusCode)) {
      const body = await error.response.json().catch(() => null);
      if (body?.validationError) throw new ValidationError(String(body.validationError));
    }

    throw error;
  }
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
