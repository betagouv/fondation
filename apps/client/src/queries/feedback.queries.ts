import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fileNameFromResponse, saveBlob } from '@/utils/file.utils';
import * as $api from '@api/sdk';
import type { AnswerSessionFeedbackDto, FoundSessionFeedbackDto } from '@api/types';

export type SessionFeedback = NonNullable<FoundSessionFeedbackDto['feedback']>;

export const feedbackKeys = {
  session: (props: { sessionId: string }) => ['feedback', 'session', props] as const,
};

export const useSessionFeedbackQuery = (props: { sessionId: string }) =>
  useQuery({
    queryFn: async () => {
      const { data } = await $api.feedback.findSessionFeedback({ path: props, throwOnError: true });
      return data.feedback;
    },
    queryKey: feedbackKeys.session(props),
  });

export function useAnswerSessionFeedbackMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (props: { answers: AnswerSessionFeedbackDto; sessionId: string }) =>
      $api.feedback.answerSessionFeedback({
        body: props.answers,
        path: { sessionId: props.sessionId },
        throwOnError: true,
      }),
    onSettled: (_data, _error, props) =>
      queryClient.invalidateQueries({ queryKey: feedbackKeys.session({ sessionId: props.sessionId }) }),
  });
}

export const useListSessionFeedbacksAsExcelMutation = () =>
  useMutation({
    mutationFn: async (): Promise<void> => {
      const { data, response } = await $api.feedback.listSessionFeedbacksAsExcel({ parseAs: 'blob' });
      saveBlob(data as Blob, fileNameFromResponse(response, 'fondation-avis-utilisateurs.xlsx'));
    },
  });
