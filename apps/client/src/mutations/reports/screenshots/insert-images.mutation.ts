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

  const queryParams = new URLSearchParams();
  queryParams.append('usage', ReportFileUsage.EMBEDDED_SCREENSHOT);
  fileIds.forEach((fileId) => {
    queryParams.append('fileIds', fileId);
  });

  return apiFetch(`/reports/${reportId}/files/upload-many?${queryParams}`, {
    method,
    body: formData
  });
};

const insertImagesWithSignedUrls = async (
  reportId: string,
  files: { file: File; fileId: string }[]
) => {
  await insertImages(reportId, files);

  const fileIds = files.map(({ fileId }) => fileId);
  const queryParams = new URLSearchParams({
    ids: fileIds.join(',')
  });

  const signedUrls = await apiFetch(`/files/signed-urls?${queryParams}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return signedUrls.map((f: any) => {
    const file = files.find((file) => file.file.name === f.name);
    if (!file) {
      throw new Error(
        `File with name ${f.name} not found in the uploaded files`
      );
    }

    return {
      file: file.file,
      signedUrl: f.signedUrl,
      fileId: file.fileId
    };
  });
};

export const useInsertImagesWithSignedUrls = () => {
  return useMutation({
    mutationFn: ({
      reportId,
      files
    }: {
      reportId: string;
      files: { file: File; fileId: string }[];
    }) => insertImagesWithSignedUrls(reportId, files)
  });
};
