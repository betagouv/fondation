import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { httpAssert } from '@/utils/http-exception';
import * as $api from '@api/sdk';

import {
  useDeleteObservationMutation,
  useObservationsQuery,
  useSearchMagistratsQuery,
} from './observations.queries';

function withClient(client: QueryClient) {
  return (props: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{props.children}</QueryClientProvider>
  );
}

describe('useSearchMagistratsQuery', () => {
  it('filters the magistrats from 2 characters', async () => {
    const searchMagistrats = vi
      .spyOn($api.magistrats, 'searchMagistrats')
      .mockResolvedValue({ data: { items: [] } } as unknown as Awaited<
        ReturnType<typeof $api.magistrats.searchMagistrats>
      >);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    renderHook(() => useSearchMagistratsQuery('ma'), { wrapper: withClient(client) });

    await waitFor(() =>
      expect(searchMagistrats).toHaveBeenCalledWith({
        query: expect.objectContaining({ search: 'ma' }),
        throwOnError: true,
      }),
    );
  });
});

describe('useDeleteObservationMutation', () => {
  it('reloads the observations when the API refuses the deletion', async () => {
    const listObservations = vi
      .spyOn($api.observations, 'listObservations')
      .mockResolvedValue({ data: { observations: [] } } as unknown as Awaited<
        ReturnType<typeof $api.observations.listObservations>
      >);
    // httpAssert throws by itself: the throw only tells TypeScript that the mock never returns
    vi.spyOn($api.observations, 'deleteObservation').mockImplementation(() => {
      throw httpAssert(new Response(null, { status: 409 }));
    });
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const path = { nominationFileId: 'nomination-file', sessionId: 'session' };

    const { result } = renderHook(
      () => ({ deletion: useDeleteObservationMutation(), observations: useObservationsQuery(path) }),
      { wrapper: withClient(client) },
    );
    await waitFor(() => expect(result.current.observations.isSuccess).toBe(true));

    await act(() =>
      result.current.deletion.mutateAsync({ ...path, observationId: 'observation' }).catch(() => undefined),
    );

    expect(listObservations).toHaveBeenCalledTimes(2);
  });
});
