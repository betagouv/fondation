import { useMutation } from '@tanstack/react-query';
import { NominationFile } from 'shared-models';
import { apiFetch } from '../../../utils/api-fetch.utils';

export const useUpdateReport = () =>
  useMutation({
    mutationFn: async (props: {
      reportId: string;
      data: { comment?: string; status?: NominationFile.ReportState };
    }): Promise<void> => {
      await apiFetch(`/reports/v2/${props.reportId}`, {
        method: 'PATCH',
        body: JSON.stringify(props.data),
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });

export const useUpdateReportRuleValidation = () =>
  useMutation({
    mutationFn: async (props: { reportId: string; ruleId: string; isValidated: boolean }): Promise<void> => {
      await apiFetch<void>(`/reports/v2/${props.reportId}/rules/${props.ruleId}`, {
        method: 'PUT',
        body: JSON.stringify({ isValidated: props.isValidated }),
        headers: { 'content-type': 'application/json' }
      });
    }
  });
