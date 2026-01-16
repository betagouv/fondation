import { useQuery } from '@tanstack/react-query';
import * as $api from '@api/sdk';

export const summaryKeys = {
  detailsSummary: (props?: { sessionId: string; nominationFileId: string }) =>
    ['summaries', 'detailsSummary', props] as const
};

export const useSummaryQuery = (options: { sessionId: string; nominationFileId: string }) =>
  useQuery({
    queryKey: summaryKeys.detailsSummary(options),
    queryFn: async () => {
      const { data } = await $api.summaries.detailSummary({ path: options });
      return data ?? null;
    }
  });
