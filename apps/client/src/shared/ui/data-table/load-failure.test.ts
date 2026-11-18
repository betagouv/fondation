import { describe, expect, it, vi } from 'vitest';

import { loadFailureOf } from './load-failure';

function queryOf(state: { isError: boolean; isFetchNextPageError: boolean }) {
  return {
    ...state,
    fetchNextPage: vi.fn(() => Promise.resolve()),
    isFetching: false,
    refetch: vi.fn(() => Promise.resolve()),
  };
}

describe('loadFailureOf', () => {
  it('asks the next page again on its own when it is the one that failed', () => {
    const query = queryOf({ isError: true, isFetchNextPageError: true });

    loadFailureOf(query)?.onRetry();

    expect(query.fetchNextPage).toHaveBeenCalledOnce();
    expect(query.refetch).not.toHaveBeenCalled();
  });

  it('fetches the whole list again when the list itself failed', () => {
    const query = queryOf({ isError: true, isFetchNextPageError: false });

    loadFailureOf(query)?.onRetry();

    expect(query.refetch).toHaveBeenCalledOnce();
    expect(query.fetchNextPage).not.toHaveBeenCalled();
  });

  it('reports no failure while the list loads fine', () => {
    expect(loadFailureOf(queryOf({ isError: false, isFetchNextPageError: false }))).toBeUndefined();
  });
});
