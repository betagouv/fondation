import type { DataTableLoadFailure } from './DataTable';

export function loadFailureOf(query: {
  fetchNextPage: () => Promise<unknown>;
  isError: boolean;
  isFetching: boolean;
  isFetchNextPageError: boolean;
  refetch: () => Promise<unknown>;
}): DataTableLoadFailure | undefined {
  if (!query.isError) return undefined;

  return {
    isNextPage: query.isFetchNextPageError,
    isRetrying: query.isFetching,
    onRetry: () => void (query.isFetchNextPageError ? query.fetchNextPage() : query.refetch()),
  };
}
