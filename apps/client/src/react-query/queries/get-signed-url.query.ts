import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { FilesContextRestContract } from 'shared-models';
import { apiFetch } from '../../utils/api-fetch.utils';

type Endpoint = FilesContextRestContract['endpoints']['getSignedUrls'];
type GetSignedUrlsResponse = Endpoint['response'];

const getSignedUrl = async (fileIds: string[]) => {
  const { method, path }: Partial<Endpoint> = {
    method: 'GET',
    path: 'signed-urls'
  };
  const searchParams = new URLSearchParams();
  fileIds.forEach((id) => searchParams.append('ids', id));

  return apiFetch<GetSignedUrlsResponse>(`/files/${path}?${searchParams.toString()}`, {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

export const useGetSignedUrl = (fileIds: string[]): UseQueryResult<GetSignedUrlsResponse | null, Error> => {
  return useQuery({
    queryKey: ['signed-url', fileIds],
    queryFn: () => getSignedUrl(fileIds),
    enabled: fileIds.length > 0,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });
};
