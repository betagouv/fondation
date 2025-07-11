import { useMutation } from '@tanstack/react-query';
import {
  ReportFileUsage,
  type ReportsContextRestContract
} from 'shared-models';
import { apiFetch } from '../../../utils/api-fetch.utils';

export const addTimestampToFiles = async (files: File[], timestamp: number) => {
  return await Promise.all(
    files.map(async (file) => {
      const screenshotName = `${file.name}-${timestamp}`;

      return new File([await file.arrayBuffer()], screenshotName, {
        type: file.type
      });
    })
  );
};

const insertImages = async (
  reportId: string,
  files: { file: File; fileId: string }[]
) => {
  const formData = new FormData();
  files.forEach(({ file }) => {
    formData.append('files', file, file.name);
  });
  const fileIds = files.map(({ fileId }) => fileId);

  const {
    method
  }: Partial<ReportsContextRestContract['endpoints']['uploadFiles']> = {
    method: 'POST'
  };

  const queryParams = new URLSearchParams({
    usage: ReportFileUsage.EMBEDDED_SCREENSHOT,
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

export const useInsertImages = () => {
  return useMutation({
    mutationFn: ({
      reportId,
      files
    }: {
      reportId: string;
      files: { file: File; fileId: string }[];
    }) => insertImages(reportId, files)
  });
};
