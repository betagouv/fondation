import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as $api from '@api/sdk';

import { memberKeys } from './members.queries';
import { useUpdateReportMutation } from './reports.queries';

describe('useUpdateReportMutation', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reloads the counts of the member home once the state of a report changes', async () => {
    vi.spyOn($api.reports, 'updateReport').mockResolvedValue(
      {} as Awaited<ReturnType<typeof $api.reports.updateReport>>,
    );
    const listMemberSessions = vi.fn().mockResolvedValue(null);
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const { result } = renderHook(
      () => ({
        sessions: useQuery({
          queryFn: listMemberSessions,
          queryKey: memberKeys.listMemberGdsSessions({ userId: 'member' }),
        }),
        update: useUpdateReportMutation(),
      }),
      { wrapper: (props) => <QueryClientProvider client={client}>{props.children}</QueryClientProvider> },
    );
    await waitFor(() => expect(result.current.sessions.isSuccess).toBe(true));

    await act(() =>
      result.current.update.mutateAsync({ data: { status: 'IN_PROGRESS' }, reportId: 'report' }),
    );

    await waitFor(() => expect(listMemberSessions).toHaveBeenCalledTimes(2));
  });
});
