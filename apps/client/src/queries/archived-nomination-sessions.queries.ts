import { useQuery } from '@tanstack/react-query';

import type { FormationEnum } from '@/types/enums.types';
import * as $api from '@api/sdk';

export const archivedSessionKeys = {
  listArchivedGdsSessions: (props?: {
    pagination: { pageIndex: number; pageSize: number } | undefined;
    sorting?: { id: 'date' | 'dueDate'; desc: boolean }[];
    filters: { formations?: FormationEnum[] } | undefined;
  }) => ['archivedSessions', 'listArchivedGdsSessions', props],
};

export const useListedArchivedGdsNominationSessionsQuery = (options: {
  pagination: { pageIndex: number; pageSize: number } | undefined;
  sorting: [] | [{ id: 'date' | 'dueDate'; desc: boolean }] | undefined;
  filters: { formations?: FormationEnum[] } | undefined;
}) =>
  useQuery({
    placeholderData: (prev) => prev,
    queryKey: archivedSessionKeys.listArchivedGdsSessions(options),
    queryFn: () =>
      $api.archivedSessions
        .listArchivedSessions({
          query: {
            page:
              (options.pagination?.pageIndex ?? 0) > 0 ? (options.pagination?.pageIndex ?? 0) + 1 : undefined,
            limit: options.pagination?.pageSize,
            sortBy: options.sorting?.[0]?.id,
            sortDesc: options.sorting?.[0]?.desc ? 'true' : undefined,
            formations: options.filters?.formations,
          },
        })
        .then(({ data = null }) => data),
  });
