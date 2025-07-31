import { useQuery } from '@tanstack/react-query';
import type { FileDocumentSnapshot } from 'shared-models';
import { apiFetch } from '../utils/api-fetch.utils';

const getTransparencyAttachmentsQuery = async (
  sessionImportId: string
): Promise<FileDocumentSnapshot[]> => {
  const query = new URLSearchParams({
    sessionImportId
  });

  return apiFetch(`/data-administration/transparence-attachments?${query}`, {
    method: 'GET'
  });
};

export const useGetTransparencyAttachmentsQuery = (sessionImportId: string) => {
  return useQuery({
    queryKey: ['transparency-attachments', sessionImportId],
    queryFn: () => getTransparencyAttachmentsQuery(sessionImportId)
  });
};
