import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fileNameFromResponse, saveBlob } from '@/utils/file.utils';
import * as $api from '@api/sdk';
import type { AnswerFeedbackDto, FoundFeedbackDto } from '@api/types';

export type Feedback = NonNullable<FoundFeedbackDto['feedback']>;

export const feedbackKeys = {
  mine: ['feedback', 'mine'] as const,
};

export const useFeedbackQuery = () =>
  useQuery({
    queryFn: async () => {
      const { data } = await $api.feedback.findFeedback({ throwOnError: true });
      return data.feedback;
    },
    queryKey: feedbackKeys.mine,
  });

export function useAnswerFeedbackMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answers: AnswerFeedbackDto) =>
      $api.feedback.answerFeedback({ body: answers, throwOnError: true }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: feedbackKeys.mine }),
  });
}

export const useListFeedbacksAsExcelMutation = () =>
  useMutation({
    mutationFn: async (): Promise<void> => {
      const { data, response } = await $api.feedback.listFeedbacksAsExcel({ parseAs: 'blob' });
      saveBlob(data as Blob, fileNameFromResponse(response, 'fondation-avis-utilisateurs.xlsx'));
    },
  });
