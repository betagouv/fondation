import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { withScreenshotUrls } from '@/utils/with-screenshot-urls';
import * as $api from '@api/sdk';
import type { DetailedHelpPageDto, HelpPageEnum } from '@api/types';

export type { HelpPageEnum };

export const helpKeys = {
  all: () => ['help'] as const,
  detailHelpPage: (props?: { page: HelpPageEnum }) => ['help', 'detailHelpPage', props] as const,
  detailReaderHelpPage: () => ['help', 'detailReaderHelpPage'] as const,
};

export const useHelpPageQuery = (options: { page: HelpPageEnum }) =>
  useQuery({
    queryFn: async () => {
      const { data } = await $api.help.detailHelpPage({ path: options, throwOnError: true });
      data.content = withScreenshotUrls(data.content, data.screenshots);

      return data;
    },
    queryKey: helpKeys.detailHelpPage(options),
    refetchOnWindowFocus: false,
  });

export const useReaderHelpPageQuery = () =>
  useQuery({
    queryFn: async () => {
      const { data } = await $api.help.detailReaderHelpPage({ throwOnError: true });
      data.content = withScreenshotUrls(data.content, data.screenshots);

      return data;
    },
    queryKey: helpKeys.detailReaderHelpPage(),
    refetchOnWindowFocus: false,
  });

export function useIncludeFilesInHelpPageContentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: { files: readonly File[]; page: HelpPageEnum }) => {
      const { data } = await $api.help.includeFilesInHelpPageContent({
        body: { files: [...mutation.files] },
        path: { page: mutation.page },
        throwOnError: true,
      });

      return data;
    },
    onSuccess(data, { page }) {
      queryClient.setQueryData(helpKeys.detailHelpPage({ page }), (old: DetailedHelpPageDto | undefined) =>
        old
          ? ({ ...old, screenshots: old.screenshots.concat(data.items) } satisfies DetailedHelpPageDto)
          : old,
      );
    },
  });
}

export function useWriteHelpPageContentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: { content: string; page: HelpPageEnum }) => {
      await $api.help.writeHelpPageContent({
        body: { content: mutation.content },
        path: { page: mutation.page },
        throwOnError: true,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: helpKeys.all() }),
  });
}
