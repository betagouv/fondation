import { useMutation } from '@tanstack/react-query';
import {
  changeRuleValidationStateDto,
  type ReportsContextRestContract
} from 'shared-models';
import { apiFetch } from '../../../utils/api-fetch.utils';

const updateRule = (ruleId: string, validated: boolean) => {
  changeRuleValidationStateDto.parse({ validated });

  const {
    method
  }: Partial<ReportsContextRestContract['endpoints']['updateRule']> = {
    method: 'PUT'
  };

  return apiFetch(`/reports/rules/${ruleId}`, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ validated })
  });
};
export const useUpdateRule = () => {
  return useMutation({
    mutationFn: ({
      ruleId,
      validated
    }: {
      ruleId: string;
      validated: boolean;
    }) => updateRule(ruleId, validated),
    mutationKey: ['updateRule']
  });
};
