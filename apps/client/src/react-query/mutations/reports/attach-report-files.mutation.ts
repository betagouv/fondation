import { useMutation } from '@tanstack/react-query';
import type { ReportFileUsage } from 'shared-models';

import { ACCEPTED_MIME_TYPES } from '../../../constants/mimetypes.constants';
import { apiFetch } from '../../../utils/api-fetch.utils';
import { InvalidMimeTypeError } from '../../../utils/InvalidMimeType.error';

const attachReportFiles = (reportId: string, files: File[], usage: ReportFileUsage) => {
  const formData = new FormData();
  for (const file of files) {
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) throw new InvalidMimeTypeError({ fileName: file.name });
    formData.append('files', file);
  }

  const searchParams = new URLSearchParams({ usage });

  return apiFetch<void>(`/reports/v2/${reportId}/files?${searchParams.toString()}`, {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });
};

export const useAttachReportFiles = () => {
  return useMutation({
    mutationFn: ({ reportId, files, usage }: { reportId: string; files: File[]; usage: ReportFileUsage }) =>
      attachReportFiles(reportId, files, usage)
  });
};
