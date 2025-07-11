import { useMutation } from '@tanstack/react-query';
import type {
  ReportFileUsage,
  ReportsContextRestContract
} from 'shared-models';
import { ACCEPTED_MIME_TYPES } from '../../constants/mimetypes.constants';
import { apiFetch } from '../../utils/api-fetch.utils';
import { DeterministicUuidGenerator } from '../../utils/deterministicUuidGenerator';
import { RealFileProvider } from '../../utils/realFileProvider';

const attachReportFiles = (
  reportId: string,
  files: File[],
  usage: ReportFileUsage
) => {
  files.map(new RealFileProvider().assertMimeTypeFactory(ACCEPTED_MIME_TYPES));
  const filesArg = files.map((file) => ({
    file,
    fileId: new DeterministicUuidGenerator().genUuid()
  }));

  const formData = new FormData();
  filesArg.forEach(({ file }) => {
    formData.append('files', file, file.name);
  });
  const fileIds = filesArg.map(({ fileId }) => fileId);

  const {
    method
  }: Partial<ReportsContextRestContract['endpoints']['uploadFiles']> = {
    method: 'POST'
  };

  const queryParams = new URLSearchParams({
    usage,
    fileIds: Array.isArray(fileIds) ? fileIds.join(',') : fileIds
  });

  return apiFetch(`/reports/${reportId}/files/upload-many?${queryParams}`, {
    method,
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const useAttachReportFiles = () => {
  return useMutation({
    mutationFn: ({
      reportId,
      files,
      usage
    }: {
      reportId: string;
      files: File[];
      usage: ReportFileUsage;
    }) => attachReportFiles(reportId, files, usage)
  });
};
