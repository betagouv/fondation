import { useQuery } from '@tanstack/react-query';

import * as $api from '@api/sdk';

export const magistratKeys = {
  magistratDetails: (props: { magistratId: string }) => ['magistratDetails', props] as const,
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
