import { QueryClientProvider, useMutation, useQuery } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { httpAssert } from '@/utils/http-exception';

import { sessionKeys } from './nomination-sessions.queries';
import { queryClient } from './query-client';

describe('queryClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  it('reloads the open nomination file when the API refuses a mutation', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const detailsNominationFile = vi.fn().mockResolvedValue(null);

    const { result } = renderHook(
      () => ({
        details: useQuery({
          queryFn: detailsNominationFile,
          queryKey: sessionKeys.detailSessionNominationFile({
            nominationFileId: 'nomination-file',
            sessionId: 'session',
          }),
        }),
        mutation: useMutation({
          mutationFn: async () => httpAssert(new Response(null, { status: 409 })),
        }),
      }),
      {
        wrapper: (props) => <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>,
      },
    );
    await waitFor(() => expect(result.current.details.isSuccess).toBe(true));

    await act(() => result.current.mutation.mutateAsync().catch(() => undefined));

    expect(detailsNominationFile).toHaveBeenCalledTimes(2);
  });
});
