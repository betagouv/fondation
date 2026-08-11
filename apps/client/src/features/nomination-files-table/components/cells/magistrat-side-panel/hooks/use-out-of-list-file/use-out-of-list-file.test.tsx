import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import type { PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { makeSessionNominationFileList } from '@/test-utils/factories/session-nomination-file.factory';
import * as $api from '@api/sdk';

import { useOutOfListFile } from './use-out-of-list-file.hook';

const SESSION_ID = 'session-1';
const loadedFiles = makeSessionNominationFileList(['a', 'b']);
const [outOfListFile] = makeSessionNominationFileList(['z']);

function detailSpy(file: (typeof loadedFiles)[number] | null) {
  return vi
    .spyOn($api.sessions, 'detailNominationFile')
    .mockResolvedValue({ data: file } as Awaited<ReturnType<typeof $api.sessions.detailNominationFile>>);
}

function renderUseOutOfListFile(options: {
  dossier?: string;
  fetchNextPage?: () => void;
  isFiltered?: boolean;
  isListPending?: boolean;
}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const fetchNextPage = options.fetchNextPage ?? vi.fn();

  return renderHook(
    () =>
      useOutOfListFile({
        fetchNextPage,
        isFiltered: options.isFiltered ?? false,
        isListPending: options.isListPending ?? false,
        nominationFiles: loadedFiles,
        sessionId: SESSION_ID,
      }),
    {
      wrapper: ({ children }: PropsWithChildren) => (
        <NuqsTestingAdapter hasMemory searchParams={options.dossier ? `?dossier=${options.dossier}` : ''}>
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        </NuqsTestingAdapter>
      ),
    },
  );
}

describe('useOutOfListFile', () => {
  afterEach(() => vi.restoreAllMocks());

  it('serves nothing without a deep link', () => {
    const detail = detailSpy(outOfListFile!);

    const { result } = renderUseOutOfListFile({});

    expect(result.current).toEqual({ file: null, isResolving: false });
    expect(detail).not.toHaveBeenCalled();
  });

  it('leaves a file held by the loaded rows to the list', () => {
    const detail = detailSpy(outOfListFile!);

    const { result } = renderUseOutOfListFile({ dossier: 'a' });

    expect(result.current).toEqual({ file: null, isResolving: false });
    expect(detail).not.toHaveBeenCalled();
  });

  it('resolves a file the loaded rows do not hold', async () => {
    const detail = detailSpy(outOfListFile!);

    const { result } = renderUseOutOfListFile({ dossier: 'z' });

    expect(result.current.isResolving).toBe(true);
    await waitFor(() => expect(result.current.file?.id).toBe('z'));
    expect(detail).toHaveBeenCalledWith({
      path: { nominationFileId: 'z', sessionId: SESSION_ID },
    });
  });

  it('waits for the list before resolving anything', () => {
    const detail = detailSpy(outOfListFile!);

    const { result } = renderUseOutOfListFile({ dossier: 'z', isListPending: true });

    expect(result.current).toEqual({ file: null, isResolving: true });
    expect(detail).not.toHaveBeenCalled();
  });

  it('asks the table for its next page until it holds the resolved file', async () => {
    detailSpy(outOfListFile!);
    const fetchNextPage = vi.fn();

    const { result } = renderUseOutOfListFile({ dossier: 'z', fetchNextPage });

    await waitFor(() => expect(result.current.file?.id).toBe('z'));
    expect(fetchNextPage).toHaveBeenCalled();
  });

  it('leaves the table alone when the filters are what keep the file out', async () => {
    detailSpy(outOfListFile!);
    const fetchNextPage = vi.fn();

    const { result } = renderUseOutOfListFile({ dossier: 'z', fetchNextPage, isFiltered: true });

    await waitFor(() => expect(result.current.file?.id).toBe('z'));
    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('leaves the table alone while no file is resolved', async () => {
    detailSpy(null);
    const fetchNextPage = vi.fn();

    const { result } = renderUseOutOfListFile({ dossier: 'z', fetchNextPage });

    await waitFor(() => expect(result.current.isResolving).toBe(false));
    expect(result.current.file).toBeNull();
    expect(fetchNextPage).not.toHaveBeenCalled();
  });
});
