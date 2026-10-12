import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as $api from '@api/sdk';
import type { DetailedSummaryDto } from '@api/types';

export const summaryKeys = {
  detailsSummary: (props?: { nominationFileId: string; sessionId: string }) =>
    ['summaries', 'detailsSummary', props] as const,
  searchSummaryReaders: (props?: {
    includeIds?: readonly string[];
    nominationFileId: string;
    search?: string;
    sessionId: string;
  }) => ['summaries', 'searchSummaryReaders', props] as const,
};

function injectScreenshotUrls(
  content: string,
  screenshots: readonly { id: string; name: string; url: string }[],
): string {
  const byId = new Map(screenshots.map((s) => [s.id, s.url]));
  const byName = new Map(screenshots.map((s) => [s.name, s.url]));

  const { body } = new DOMParser().parseFromString(content, 'text/html');
  for (const $img of body.querySelectorAll('img')) {
    const url =
      ($img.dataset.fileId && byId.get($img.dataset.fileId)) ||
      ($img.dataset.fileName && byName.get($img.dataset.fileName));
    if (url) $img.src = url;
  }

  return body.innerHTML;
}

export const useSummaryQuery = (options: { nominationFileId: string; sessionId: string }) =>
  useQuery({
    queryFn: async () => {
      const { data } = await $api.summaries.detailSummary({ path: options });

      if (data) {
        data.summary.content = injectScreenshotUrls(data.summary.content, data.summary.screenshots);
      }

      return data ?? null;
    },
    queryKey: summaryKeys.detailsSummary(options),
    refetchOnWindowFocus: false,
  });

export function useAttachSummaryFilesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mutation: { files: File[]; nominationFileId: string; sessionId: string }) => {
      const { nominationFileId, sessionId } = mutation;
      await $api.summaries.attachSummaryFiles({
        body: { files: mutation.files },
        path: { nominationFileId, sessionId },
      });
    },
    onSuccess: (_, { nominationFileId, sessionId }) =>
      queryClient.invalidateQueries({
        queryKey: summaryKeys.detailsSummary({ nominationFileId, sessionId }),
      }),
  });
}

export function useDetachSummaryFilesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: { fileIds: string[]; nominationFileId: string; sessionId: string }) => {
      const { nominationFileId, sessionId } = mutation;

      await $api.summaries.detachSummaryFiles({
        path: { nominationFileId, sessionId },
        query: { fileIds: mutation.fileIds },
      });
    },
    onSuccess: (_, { fileIds, nominationFileId, sessionId }) => {
      queryClient.setQueryData(
        summaryKeys.detailsSummary({ nominationFileId, sessionId }),
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
    mutationFn: async (mutation: { files: readonly File[]; nominationFileId: string; sessionId: string }) => {
      const { files, nominationFileId, sessionId } = mutation;
      const { data } = await $api.summaries.includeFilesInContent({
        body: { files: [...files] },
        path: { nominationFileId, sessionId },
      });

      return data ?? null;
    },

    onSuccess(data, { nominationFileId, sessionId }) {
      queryClient.setQueryData(
        summaryKeys.detailsSummary({ nominationFileId, sessionId }),
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
    mutationFn: async (mutation: { content: string; nominationFileId: string; sessionId: string }) => {
      const { content, nominationFileId, sessionId } = mutation;
      await $api.summaries.writeSummary({
        body: { content },
        path: { nominationFileId, sessionId },
      });
    },
    onSuccess(_, { content, nominationFileId, sessionId }) {
      queryClient.setQueryData(
        summaryKeys.detailsSummary({ nominationFileId, sessionId }),
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
  includeIds?: string[];
  nominationFileId: string;
  search?: string;
  sessionId: string;
}) =>
  useQuery({
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const { includeIds, nominationFileId, search, sessionId } = options;
      const { data } = await $api.summaries.searchSummaryReaders({
        path: { nominationFileId, sessionId },
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
    queryKey: summaryKeys.searchSummaryReaders(options),
    staleTime: 30_000,
  });

export function useUpdateSummaryReadersMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: {
      nominationFileId: string;
      readerIds: readonly string[];
      sessionId: string;
    }) => {
      const { nominationFileId, readerIds, sessionId } = mutation;
      await $api.summaries.updateSummaryReadersList({
        body: { readerIds: readerIds as string[] },
        path: { nominationFileId, sessionId },
      });
    },

    onSuccess: (_, { nominationFileId, sessionId }) =>
      queryClient.invalidateQueries({
        queryKey: summaryKeys.detailsSummary({ nominationFileId, sessionId }),
      }),
  });
}

export function useCreateSummaryMutation() {
  return useMutation({
    mutationFn: async (mutation: { nominationFileId: string; sessionId: string }) => {
      const { nominationFileId, sessionId } = mutation;
      const { data } = await $api.summaries.createSummary({
        path: { nominationFileId, sessionId },
      });

      return data ?? null;
    },
  });
}
