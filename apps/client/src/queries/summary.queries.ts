import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as $api from '@api/sdk';
import type { DetailedSummaryDto } from '@api/types';

export const summaryKeys = {
  detailsSummary: (props?: { sessionId: string; nominationFileId: string }) =>
    ['summaries', 'detailsSummary', props] as const,
  searchSummaryReaders: (props?: {
    sessionId: string;
    nominationFileId: string;
    search?: string;
    includeIds?: readonly string[];
  }) => ['summaries', 'searchSummaryReaders', props] as const,
};

// Replace <img> file references (data-file-id / data-file-name) with their real URLs so images render
function injectScreenshotUrls(
  content: string,
  screenshots: readonly { id: string; name: string; url: string }[],
): string {
  const byId = new Map(screenshots.map((s) => [s.id, s.url]));
  const byName = new Map(screenshots.map((s) => [s.name, s.url]));

  const $div = document.createElement('div');
  $div.innerHTML = content;
  for (const $img of $div.querySelectorAll('img')) {
    const url =
      ($img.dataset.fileId && byId.get($img.dataset.fileId)) ||
      ($img.dataset.fileName && byName.get($img.dataset.fileName));
    if (url) $img.src = url;
  }

  return $div.innerHTML;
}

export const useSummaryQuery = (options: { sessionId: string; nominationFileId: string }) =>
  useQuery({
    refetchOnWindowFocus: false,
    queryKey: summaryKeys.detailsSummary(options),
    queryFn: async () => {
      const { data } = await $api.summaries.detailSummary({ path: options });

      if (data) {
        data.summary.content = injectScreenshotUrls(data.summary.content, data.summary.screenshots);
      }

      return data ?? null;
    },
  });

export function useAttachSummaryFilesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mutation: { files: File[]; sessionId: string; nominationFileId: string }) => {
      const { nominationFileId, sessionId } = mutation;
      await $api.summaries.attachSummaryFiles({
        path: { sessionId, nominationFileId },
        body: { files: mutation.files },
      });
    },
    onSuccess: (_, { sessionId, nominationFileId }) =>
      queryClient.invalidateQueries({
        queryKey: summaryKeys.detailsSummary({ sessionId, nominationFileId }),
      }),
  });
}

export function useDetachSummaryFilesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: { fileIds: string[]; sessionId: string; nominationFileId: string }) => {
      const { nominationFileId, sessionId } = mutation;

      await $api.summaries.detachSummaryFiles({
        path: { sessionId, nominationFileId },
        query: { fileIds: mutation.fileIds },
      });
    },
    onSuccess: (_, { sessionId, nominationFileId, fileIds }) => {
      queryClient.setQueryData(
        summaryKeys.detailsSummary({ sessionId, nominationFileId }),
        (old: DetailedSummaryDto | undefined) => {
          if (!old) return old;

          return {
            ...old,
            summary: {
              ...old.summary,
              attachments: old.summary.attachments.filter((a) => !fileIds.includes(a.id)),
            },
          } satisfies DetailedSummaryDto;
        },
      );
    },
  });
}

export const useGenerateSummaryAttachmentPublicUrlMutation = () =>
  useMutation({
    async mutationFn(mutation: {
      fileId: string;
      nominationFileId: string;
      sessionId: string;
    }): Promise<string | null> {
      const { fileId, nominationFileId, sessionId } = mutation;
      const { data } = await $api.summaries.generateAttachmentPublicUrl({
        path: { fileId, nominationFileId, sessionId },
      });

      return data?.url ?? null;
    },
  });

export function useIncludeFileInSummaryContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mutation: { sessionId: string; nominationFileId: string; files: readonly File[] }) => {
      const { sessionId, nominationFileId, files } = mutation;
      const { data } = await $api.summaries.includeFilesInContent({
        path: { sessionId, nominationFileId },
        body: { files: [...files] },
      });

      return data ?? null;
    },

    onSuccess(data, { sessionId, nominationFileId }) {
      queryClient.setQueryData(
        summaryKeys.detailsSummary({ sessionId, nominationFileId }),
        (old: DetailedSummaryDto | undefined) => {
          if (!old || !data) return old;

          return {
            ...old,
            summary: {
              ...old.summary,
              screenshots: old.summary.screenshots.concat(data.items),
            },
          } satisfies DetailedSummaryDto;
        },
      );
    },
  });
}

export function useWriteSummaryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mutation: { sessionId: string; nominationFileId: string; content: string }) => {
      const { sessionId, nominationFileId, content } = mutation;
      await $api.summaries.writeSummary({
        path: { sessionId, nominationFileId },
        body: { content },
      });
    },
    onSuccess(_, { sessionId, nominationFileId, content }) {
      queryClient.setQueryData(
        summaryKeys.detailsSummary({ sessionId, nominationFileId }),
        (old: DetailedSummaryDto | undefined) => {
          if (!old) return old;

          return {
            ...old,
            summary: {
              ...old.summary,
              content,
            },
          } satisfies DetailedSummaryDto;
        },
      );
    },
  });
}

export const useSearchSummaryReadersQuery = (options: {
  sessionId: string;
  nominationFileId: string;
  search?: string;
  includeIds?: string[];
}) =>
  useQuery({
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    queryKey: summaryKeys.searchSummaryReaders(options),
    queryFn: async () => {
      const { sessionId, nominationFileId, search, includeIds } = options;
      const { data } = await $api.summaries.searchSummaryReaders({
        path: { sessionId, nominationFileId },
        query: (search ?? '').length > 2 ? { search } : (includeIds ?? []).length ? { includeIds } : {},
      });

      if (data && !options.search && options.includeIds && options.includeIds.length > 0) {
        data?.items.sort((a, b) => {
          if (options.includeIds!.includes(a.id) && !options.includeIds!.includes(b.id)) return -1;
          if (options.includeIds!.includes(b.id) && !options.includeIds!.includes(a.id)) return 1;

          return 0;
        });
      }

      return data ?? null;
    },
  });

export function useUpdateSummaryReadersMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: {
      sessionId: string;
      nominationFileId: string;
      readerIds: readonly string[];
    }) => {
      const { sessionId, nominationFileId, readerIds } = mutation;
      await $api.summaries.updateSummaryReadersList({
        path: { sessionId, nominationFileId },
        body: { readerIds: readerIds as string[] },
      });
    },

    onSuccess: (_, { sessionId, nominationFileId }) =>
      queryClient.invalidateQueries({
        queryKey: summaryKeys.detailsSummary({ sessionId, nominationFileId }),
      }),
  });
}

export function useCreateSummaryMutation() {
  return useMutation({
    mutationFn: async (mutation: { sessionId: string; nominationFileId: string }) => {
      const { sessionId, nominationFileId } = mutation;
      const { data } = await $api.summaries.createSummary({
        path: { sessionId, nominationFileId },
      });

      return data ?? null;
    },
  });
}
