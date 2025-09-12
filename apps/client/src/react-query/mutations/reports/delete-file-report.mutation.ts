import { useMutation } from '@tanstack/react-query';
import type { ReportsContextRestContract } from 'shared-models';
import { apiFetch } from '../../../utils/api-fetch.utils';

const deleteFileReport = (reportId: string, fileName: string) => {
  const { method }: Partial<ReportsContextRestContract['endpoints']['deleteFile']> = {
    method: 'DELETE'
  };

  return apiFetch(`/reports/${reportId}/files/byName/${fileName}`, {
    method
  });
};

export const useDeleteFileReport = () => {
  return useMutation({
    mutationFn: ({ reportId, fileName }: { reportId: string; fileName: string }) =>
      deleteFileReport(reportId, fileName)
  });
};
