import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fileNameFromResponse, saveBlob } from '@/utils/file.utils';
import * as $api from '@api/sdk';
import type { AnswerSurveyDto, FoundSurveyDto } from '@api/types';

export type Survey = NonNullable<FoundSurveyDto['survey']>;

export const surveyKeys = {
  mine: ['survey', 'mine'] as const,
};

export const useSurveyQuery = () =>
  useQuery({
    queryFn: async () => {
      const { data } = await $api.survey.findSurvey({ throwOnError: true });
      return data.survey;
    },
    queryKey: surveyKeys.mine,
  });

export function useAnswerSurveyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answers: AnswerSurveyDto) => $api.survey.answerSurvey({ body: answers, throwOnError: true }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: surveyKeys.mine }),
  });
}

export const useListSurveysAsExcelMutation = () =>
  useMutation({
    mutationFn: async (): Promise<void> => {
      const { data, response } = await $api.survey.listSurveysAsExcel({ parseAs: 'blob' });
      saveBlob(data as Blob, fileNameFromResponse(response, 'fondation-avis-utilisateurs.xlsx'));
    },
  });
