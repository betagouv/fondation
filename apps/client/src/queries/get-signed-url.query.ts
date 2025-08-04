import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { FilesContextRestContract, FileVM } from 'shared-models';
import { apiFetch } from '../utils/api-fetch.utils';

const getSignedUrl = async (fileIds: string[]) => {
  const {
    method,
    path
  }: Partial<FilesContextRestContract['endpoints']['getSignedUrls']> = {
    method: 'GET',
    path: 'signed-urls'
  };
  return apiFetch(
    `/files/${path}?${new URLSearchParams({ ids: fileIds.join(',') })}`,
    {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
};

export const useGetSignedUrl = (
  fileIds: string[]
): UseQueryResult<FileVM[], Error> => {
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
