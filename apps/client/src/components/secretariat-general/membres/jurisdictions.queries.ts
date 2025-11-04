import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../utils/api-fetch.utils';

export type JurisdictionItem = {
  id: string;
  type: string;
  ville: string | null;
  label: string | null;
};

export function useFoundJurisdictionsQuery(
  options: {
    includeIds?: string[];
    search?: string;
  } = {}
) {
  return useQuery({
    queryKey: ['searchJurisdictions', options.search, options.includeIds],
    queryFn: () => {
      const encodeArray = (value: string[] | undefined) =>
        (value?.length ?? 0) > 0 ? (value?.join(',') ?? undefined) : undefined;

      const searchParams = new URLSearchParams(
        Object.entries({
          search: options.search?.trim() || undefined,
          includeIds: encodeArray(options.includeIds)
        }).filter((entry): entry is [string, string] => !!entry[1])
      ).toString();

      return apiFetch<{ items: JurisdictionItem[]; totalCount: number }>(
        `/jurisdictions/v1${searchParams ? `?${searchParams}` : ''}`,
        { method: 'GET' }
      );
    }
  });
}
