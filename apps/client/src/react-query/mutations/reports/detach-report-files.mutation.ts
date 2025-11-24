import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../../../utils/api-fetch.utils';

const detachReportFiles = (reportId: string, fileNames: readonly string[]) => {
  const searchParams = new URLSearchParams();
  for (const fileName of fileNames) {
    searchParams.append('fileNames', fileName);
  }

  return apiFetch<void>(`/reports/v2/${reportId}/files?${searchParams}`, { method: 'DELETE' });
};

export const useDetachReportFiles = () => {
  return useMutation({
    mutationFn: (props: { reportId: string; fileNames: readonly string[] }) =>
      detachReportFiles(props.reportId, props.fileNames)
  });
};
