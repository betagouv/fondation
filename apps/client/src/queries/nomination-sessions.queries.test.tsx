import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as $api from '@api/sdk';

import { sessionKeys, useArchiveNominationSessionMutation } from './nomination-sessions.queries';

describe('useArchiveNominationSessionMutation', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows the session archived once settled, then reloads its files, whose capabilities depend on it', async () => {
    vi.spyOn($api.sessions, 'archiveSession').mockResolvedValue({} as never);
    const detailSession = vi
      .fn()
      .mockResolvedValueOnce({ isArchived: false })
      .mockResolvedValue({ isArchived: true });
    const listFiles = vi.fn().mockResolvedValue(null);
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const { result } = renderHook(
      () => ({
        archive: useArchiveNominationSessionMutation({ sessionId: 'session' }),
        files: useQuery({
          queryFn: listFiles,
          queryKey: sessionKeys.listSessionNominationFiles({ sessionId: 'session' }),
        }),
        session: useQuery({
          queryFn: detailSession,
          queryKey: sessionKeys.detailSession({ sessionId: 'session' }),
        }),
      }),
      { wrapper: (props) => <QueryClientProvider client={client}>{props.children}</QueryClientProvider> },
    );
    await waitFor(() =>
      expect(result.current.files.isSuccess && result.current.session.isSuccess).toBe(true),
    );

    await act(() => result.current.archive.mutateAsync());

    expect(client.getQueryData(sessionKeys.detailSession({ sessionId: 'session' }))).toEqual({
      isArchived: true,
    });
    await waitFor(() => expect(listFiles).toHaveBeenCalledTimes(2));
  });
});
