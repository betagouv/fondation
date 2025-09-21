import { useMutation } from '@tanstack/react-query';
import type { ReportsContextRestContract } from 'shared-models';
import { apiFetch } from '../../../utils/api-fetch.utils';

const deleteFilesReport = (reportId: string, fileNames: string[]) => {
  const { method }: Partial<ReportsContextRestContract['endpoints']['deleteFiles']> = {
    method: 'DELETE'
  };

  const queryParams = new URLSearchParams({
    fileNames: fileNames.join(',')
  });

  return apiFetch(`/reports/${reportId}/files/byNames?${queryParams}`, {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

export const useDeleteFilesReport = () => {
  return useMutation({
    mutationFn: ({ reportId, fileNames }: { reportId: string; fileNames: string[] }) =>
      deleteFilesReport(reportId, fileNames)
  });
};
