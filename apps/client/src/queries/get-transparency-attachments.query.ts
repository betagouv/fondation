import { useQuery } from '@tanstack/react-query';
import type { DataAdministrationContextRestContract } from 'shared-models';
import { apiFetch } from '../utils/api-fetch.utils';

type Endpoint = DataAdministrationContextRestContract['endpoints']['getTransparenceAttachments'];
type GetTransparenceResponse = Endpoint['response'];

const getTransparencyAttachmentsQuery = async (sessionImportId: string) => {
  const query = new URLSearchParams({
    sessionImportId
  });

  return apiFetch<GetTransparenceResponse>(`/data-administration/transparence-attachments?${query}`, {
    method: 'GET'
  });
};

export const SG_TRANSPARENCY_ATTACHMENTS_QUERY_KEY = 'transparency-attachments';
export const useGetTransparencyAttachmentsQuery = (sessionImportId: string) => {
  return useQuery({
    queryKey: [SG_TRANSPARENCY_ATTACHMENTS_QUERY_KEY, sessionImportId],
    queryFn: () => getTransparencyAttachmentsQuery(sessionImportId),
    enabled: !!sessionImportId
  });
};
