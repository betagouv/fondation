import { useMutation } from '@tanstack/react-query';
import {
  Magistrat,
  SessionType,
  type DataAdministrationContextRestContract,
  type ImportSessionAttachmentDto
} from 'shared-models';
import type { DateOnly } from '../../models/date-only.model';
import { apiFetch } from '../../utils/api-fetch.utils';

const addAttachment = (
  sessionId: string,
  dateSession: DateOnly,
  formation: Magistrat.Formation,
  name: string,
  file: File
) => {
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
    sessionType: SessionType.TRANSPARENCE,
    dateSession: dateSession.toFormattedString('yyyy-MM-dd'),
    formation,
    name
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
    mutationFn: ({
      sessionId,
      dateSession,
      formation,
      name,
      file
    }: {
      sessionId: string;
      dateSession: DateOnly;
      formation: Magistrat.Formation;
      name: string;
      file: File;
    }) => addAttachment(sessionId, dateSession, formation, name, file)
  });
};
