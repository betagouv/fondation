import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { httpAssert } from '@/utils/http-exception';
import * as $api from '@api/sdk';

import {
  useUpdateNominationFileCommentMutation,
  useWriteNominationFileMemberMemoMutation,
} from './members.queries';
import { sessionKeys } from './nomination-sessions.queries';

const memo = {
  memo: 'À relire',
  nominationFileId: 'nomination-file',
  sessionId: 'session',
  userId: 'member',
};

function renderMemoWithList() {
  const listNominationFiles = vi.fn().mockResolvedValue(null);
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });

  const { result } = renderHook(
    () => ({
      list: useQuery({
        queryFn: listNominationFiles,
        queryKey: sessionKeys.listSessionNominationFiles({ sessionId: memo.sessionId }),
      }),
      memo: useWriteNominationFileMemberMemoMutation(),
    }),
    { wrapper: (props) => <QueryClientProvider client={client}>{props.children}</QueryClientProvider> },
  );

  return { listNominationFiles, result };
}

describe('useUpdateNominationFileCommentMutation', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reloads a file the side panel reads outside the loaded list once its comment is saved', async () => {
    vi.spyOn($api.sessions, 'updateNominationFileComment').mockResolvedValue(
      {} as Awaited<ReturnType<typeof $api.sessions.updateNominationFileComment>>,
    );
    const detailNominationFile = vi.fn().mockResolvedValue(null);
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const { result } = renderHook(
      () => ({
        comment: useUpdateNominationFileCommentMutation(),
        detail: useQuery({
          queryFn: detailNominationFile,
          queryKey: sessionKeys.detailSessionNominationFile({
            nominationFileId: memo.nominationFileId,
            sessionId: memo.sessionId,
          }),
        }),
      }),
      { wrapper: (props) => <QueryClientProvider client={client}>{props.children}</QueryClientProvider> },
    );
    await waitFor(() => expect(result.current.detail.isSuccess).toBe(true));

    await act(() =>
      result.current.comment.mutateAsync({
        comment: 'À compléter',
        nominationFileId: memo.nominationFileId,
        sessionId: memo.sessionId,
      }),
    );

    await waitFor(() => expect(detailNominationFile).toHaveBeenCalledTimes(2));
  });
});

describe('useWriteNominationFileMemberMemoMutation', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reloads the list when the API refuses the memo of a member who became a reporter', async () => {
    // httpAssert throws by itself: the throw only tells TypeScript that the mock never returns
    vi.spyOn($api.members, 'writeNominationFileMemberMemo').mockImplementation(() => {
      throw httpAssert(new Response(null, { status: 403 }));
    });
    const { listNominationFiles, result } = renderMemoWithList();
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));

    await act(() => result.current.memo.mutateAsync(memo).catch(() => undefined));

    expect(listNominationFiles).toHaveBeenCalledTimes(2);
  });

  it('reloads a file the side panel reads outside the loaded list once its memo is saved', async () => {
    vi.spyOn($api.members, 'writeNominationFileMemberMemo').mockResolvedValue(
      {} as Awaited<ReturnType<typeof $api.members.writeNominationFileMemberMemo>>,
    );
    const detailNominationFile = vi.fn().mockResolvedValue(null);
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const { result } = renderHook(
      () => ({
        detail: useQuery({
          queryFn: detailNominationFile,
          queryKey: sessionKeys.detailSessionNominationFile({
            nominationFileId: memo.nominationFileId,
            sessionId: memo.sessionId,
          }),
        }),
        memo: useWriteNominationFileMemberMemoMutation(),
      }),
      { wrapper: (props) => <QueryClientProvider client={client}>{props.children}</QueryClientProvider> },
    );
    await waitFor(() => expect(result.current.detail.isSuccess).toBe(true));

    await act(() => result.current.memo.mutateAsync(memo));

    await waitFor(() => expect(detailNominationFile).toHaveBeenCalledTimes(2));
  });

  it('keeps the list loaded once when the memo is saved', async () => {
    vi.spyOn($api.members, 'writeNominationFileMemberMemo').mockResolvedValue(
      {} as Awaited<ReturnType<typeof $api.members.writeNominationFileMemberMemo>>,
    );
    const { listNominationFiles, result } = renderMemoWithList();
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));

    await act(() => result.current.memo.mutateAsync(memo));

    expect(listNominationFiles).toHaveBeenCalledTimes(1);
  });
});
