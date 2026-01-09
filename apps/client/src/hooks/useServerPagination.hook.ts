import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export interface ServerPaginationConfig {
  defaultLimit?: number;
}

export interface ServerPaginationResult {
  page: number;
  limit: number;
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSort: (field: string) => void;
  getPageUrl: (pageNumber: number) => string;
  getSortIcon: (field: string) => 'fr-icon-arrow-down-line' | 'fr-icon-arrow-up-line';
}

export function useServerPagination(config: ServerPaginationConfig = {}): ServerPaginationResult {
  const { defaultLimit = 20 } = config;

  const [params, setParams] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(defaultLimit),
      sortField: parseAsString,
      sortDirection: parseAsStringLiteral(['asc', 'desc'] as const).withDefault('asc')
    },
    { clearOnDefault: false }
  );

  const { search } = useLocation();

  const setPage = useCallback(
    (page: number) => {
      setParams({ page });
    },
    [setParams]
  );

  const setLimit = useCallback(
    (limit: number) => {
      setParams({ limit, page: 1 });
    },
    [setParams]
  );

  const setSort = useCallback(
    (field: string) => {
      const newDirection = params.sortField === field && params.sortDirection === 'asc' ? 'desc' : 'asc';

      setParams({ sortField: field, sortDirection: newDirection, page: 1 });
    },
    [params.sortField, params.sortDirection, setParams]
  );

  const getPageUrl = useCallback(
    (pageNumber: number) => {
      const newParams = new URLSearchParams(search);
      newParams.set('page', String(pageNumber));
      newParams.set('limit', String(params.limit));
      return `?${newParams.toString()}`;
    },
    [search, params.limit]
  );

  const getSortIcon = useCallback(
    (field: string): 'fr-icon-arrow-down-line' | 'fr-icon-arrow-up-line' => {
      if (params.sortField !== field) {
        return 'fr-icon-arrow-down-line';
      }
      return params.sortDirection === 'asc' ? 'fr-icon-arrow-up-line' : 'fr-icon-arrow-down-line';
    },
    [params.sortField, params.sortDirection]
  );

  return useMemo(
    () => ({
      page: params.page,
      limit: params.limit,
      sortField: params.sortField,
      sortDirection: params.sortDirection,
      setPage,
      setLimit,
      setSort,
      getPageUrl,
      getSortIcon
    }),
    [params, setPage, setLimit, setSort, getPageUrl, getSortIcon]
  );
}
