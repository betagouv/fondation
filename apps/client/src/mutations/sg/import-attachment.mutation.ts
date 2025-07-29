import { useMutation } from '@tanstack/react-query';
import {
  SessionType,
  type DataAdministrationContextRestContract,
  type ImportSessionAttachmentDto
} from 'shared-models';
import { apiFetch } from '../../utils/api-fetch.utils';

const addAttachment = (sessionId: string, file: File) => {
  const formData = new FormData();
  formData.append('fichier', file, file.name);

  const {
    method
  }: Partial<
    DataAdministrationContextRestContract['endpoints']['importSessionAttachment']
  > = {
    method: 'POST'
  };

  const importSessionQueryParams: ImportSessionAttachmentDto = {
    sessionId,
    sessionType: SessionType.TRANSPARENCE
  };
  const queryParams = new URLSearchParams(importSessionQueryParams);

  return apiFetch(
    `/data-administration/import-session-attachment?${queryParams}`,
    {
      method,
      body: formData
    }
  );
};

export const useImportAttachment = () => {
  return useMutation({
    mutationFn: ({ sessionId, file }: { sessionId: string; file: File }) =>
      addAttachment(sessionId, file)
  });
};
