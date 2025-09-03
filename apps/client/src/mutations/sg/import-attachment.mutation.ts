import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Magistrat,
  type DataAdministrationContextRestContract,
  type ImportSessionAttachmentDto
} from 'shared-models';
import type { DateOnly } from '../../models/date-only.model';
import { SG_TRANSPARENCY_ATTACHMENTS_QUERY_KEY } from '../../queries/get-transparency-attachments.query';
import { apiFetch } from '../../utils/api-fetch.utils';

const addAttachment = (
  sessionImportId: string,
  dateSession: DateOnly,
  formation: Magistrat.Formation,
  name: string,
  file: File
) => {
  const formData = new FormData();
  formData.append('fichier', file, file.name);

  const { method }: Partial<DataAdministrationContextRestContract['endpoints']['importSessionAttachment']> = {
    method: 'POST'
  };

  const importSessionQueryParams: ImportSessionAttachmentDto = {
    sessionImportId,
    sessionType: 'TRANSPARENCE',
    dateSession: dateSession.toFormattedString('yyyy-MM-dd'),
    formation,
    name
  };
  const queryParams = new URLSearchParams(importSessionQueryParams);

  return apiFetch(`/data-administration/import-session-attachment?${queryParams}`, {
    method,
    body: formData
  });
};

export const useImportAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionImportId,
      dateSession,
      formation,
      name,
      file
    }: {
      sessionImportId: string;
      dateSession: DateOnly;
      formation: Magistrat.Formation;
      name: string;
      file: File;
    }) => addAttachment(sessionImportId, dateSession, formation, name, file),
    onSuccess: async (_, { sessionImportId }) => {
      await queryClient.refetchQueries({
        queryKey: [SG_TRANSPARENCY_ATTACHMENTS_QUERY_KEY, sessionImportId]
      });
    }
  });
};
