import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as $api from '@api/sdk';
import type { DetailedSummaryDto } from '@api/types';

export const summaryKeys = {
  detailsSummary: (props?: { sessionId: string; nominationFileId: string }) =>
    ['summaries', 'detailsSummary', props] as const
};

export const useSummaryQuery = (options: { sessionId: string; nominationFileId: string }) =>
  useQuery({
    refetchOnWindowFocus: false,
    queryKey: summaryKeys.detailsSummary(options),
    queryFn: async () => {
      const { data } = await $api.summaries.detailSummary({ path: options });
      return data ?? null;
    }
  });

export function useAttachSummaryFilesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mutation: { files: File[]; sessionId: string; nominationFileId: string }) => {
      const { nominationFileId, sessionId } = mutation;
      await $api.summaries.attachSummaryFiles({
        path: { sessionId, nominationFileId },
        body: { files: mutation.files }
      });
    },
    onSuccess: (_, { sessionId, nominationFileId }) =>
      queryClient.invalidateQueries({
        queryKey: summaryKeys.detailsSummary({ sessionId, nominationFileId })
      })
  });
}

export function useDetachSummaryFilesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutation: { fileIds: string[]; sessionId: string; nominationFileId: string }) => {
      const { nominationFileId, sessionId } = mutation;

      await $api.summaries.detachSummaryFiles({
        path: { sessionId, nominationFileId },
        query: { fileIds: mutation.fileIds }
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
              attachments: old.summary.attachments.filter((a) => !fileIds.includes(a.id))
            }
          } satisfies DetailedSummaryDto;
        }
      );
    }
  });
}

export const useGenerateSummaryAttachmentPublicUrlMutation = () =>
  useMutation({
    async mutationFn(mutation: { sessionId: string; nominationFileId: string; fileId: string }) {
      const { sessionId, nominationFileId, fileId } = mutation;
      const { data } = await $api.summaries.generateAttachmentPublicUrl({
        path: { sessionId, nominationFileId, fileId }
      });

      if (!data) return;

      const $a = document.createElement('a');
      $a.href = data.url;
      $a.target = '_blank';
      $a.rel = 'noopener noreferrer';

      document.body.appendChild($a);

      $a.click();
      $a.remove();
    }
  });
