import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import * as $api from '@api/sdk';

export const magistratKeys = {
  magistratDetails: (props: { magistratId: string }) => ['magistratDetails', props] as const,
  magistratNominationFiles: (props: { magistratId: string }) => ['magistratNominationFiles', props] as const,
  magistratObservations: (props: { magistratId: string }) => ['magistratObservations', props] as const,
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
