import { useMutation } from '@tanstack/react-query';
import { reportUpdateDto, type ReportsContextRestContract } from 'shared-models';
import { apiFetch } from '../../../utils/api-fetch.utils';
import type { ReportSM } from '../../queries/list-reports.queries';

export type UpdateReportParams = {
  reportId: string;
  data: {
    comment?: string;
    state?: ReportSM['state'];
  };
};

const updateReport = (reportId: string, data: UpdateReportParams['data']) => {
  reportUpdateDto.parse(data);

  const { method }: Partial<ReportsContextRestContract['endpoints']['updateReport']> = {
    method: 'PUT'
  };

  return apiFetch(`/reports/${reportId}`, {
    method,
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

export const useUpdateReport = () => {
  return useMutation({
    mutationFn: ({ reportId, data }: { reportId: string; data: UpdateReportParams['data'] }) =>
      updateReport(reportId, data)
  });
};
