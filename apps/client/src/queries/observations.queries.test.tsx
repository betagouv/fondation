import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import * as $api from '@api/sdk';

import { useSearchMagistratsQuery } from './observations.queries';

describe('useSearchMagistratsQuery', () => {
  it('filters the magistrats from 2 characters', async () => {
    const searchMagistrats = vi
      .spyOn($api.magistrats, 'searchMagistrats')
      .mockResolvedValue({ data: { items: [] } } as unknown as Awaited<
        ReturnType<typeof $api.magistrats.searchMagistrats>
      >);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    renderHook(() => useSearchMagistratsQuery('ma'), {
      wrapper: (props) => <QueryClientProvider client={client}>{props.children}</QueryClientProvider>,
    });

    await waitFor(() =>
      expect(searchMagistrats).toHaveBeenCalledWith({ query: expect.objectContaining({ search: 'ma' }) }),
    );
  });
});
