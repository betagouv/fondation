import { useQuery } from '@tanstack/react-query';
import * as $api from '@api/sdk';

export type JurisdictionItem = {
  id: string;
  type: string;
  ville: string | null;
  label: string | null;
};

export const jurisdictionKeys = {
  searchJurisdiction: (props: { search?: string; includIds?: readonly string[] }) => [
    'searchJurisdictions',
    props
  ]
};

export const useFoundJurisdictionsQuery = (
  options: {
    includeIds?: string[];
    search?: string;
  } = {}
) =>
  useQuery({
    placeholderData: (prev) => prev,
    queryKey: jurisdictionKeys.searchJurisdiction(options),
    queryFn: () =>
      $api.jurisdictions
        .search({
          query: { search: options.search, includeIds: options.includeIds?.join(',') }
        })
        .then(({ data = null }) => data)
  });
