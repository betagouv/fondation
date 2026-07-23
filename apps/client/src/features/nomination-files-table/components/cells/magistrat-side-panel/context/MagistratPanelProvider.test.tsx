import { act, render } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, it, vi } from 'vitest';

import { makeSessionNominationFileList } from '@/test-utils/factories/session-nomination-file.factory';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { useMagistratPanel, type MagistratPanelContextValue } from './magistrat-panel.context';
import { MagistratPanelProvider } from './MagistratPanelProvider';

type ProviderProps = {
  isFetching: boolean;
  nominationFiles: SessionNominationFile[];
  onPageChange: (pageIndex: number) => void;
  pagination: { pageIndex: number; pageSize: number };
  totalCount: number;
};

function renderProvider(initialProps: ProviderProps, searchParams?: string) {
  const ref: { current: MagistratPanelContextValue | null } = { current: null };

  function Consumer() {
    ref.current = useMagistratPanel();
    return null;
  }

  const view = render(
    <NuqsTestingAdapter hasMemory searchParams={searchParams}>
      <MagistratPanelProvider {...initialProps}>
        <Consumer />
      </MagistratPanelProvider>
    </NuqsTestingAdapter>,
  );

  return {
    get panel() {
      if (!ref.current) throw new Error('panel context not ready');
      return ref.current;
    },
    rerender: (props: ProviderProps) =>
      view.rerender(
        <NuqsTestingAdapter hasMemory>
          <MagistratPanelProvider {...props}>
            <Consumer />
          </MagistratPanelProvider>
        </NuqsTestingAdapter>,
      ),
  };
}

const PAGE_SIZE = 2;
const firstPage = makeSessionNominationFileList(['a', 'b']);
const secondPage = makeSessionNominationFileList(['c', 'd']);

function baseProps(overrides: Partial<ProviderProps> = {}): ProviderProps {
  return {
    isFetching: false,
    nominationFiles: firstPage,
    onPageChange: vi.fn(),
    pagination: { pageIndex: 0, pageSize: PAGE_SIZE },
    totalCount: 4,
    ...overrides,
  };
}

describe('MagistratPanelProvider', () => {
  it('starts closed', () => {
    const view = renderProvider(baseProps());

    expect(view.panel.isOpen).toBe(false);
    expect(view.panel.activeFile).toBeNull();
    expect(view.panel.hasPrevious).toBe(false);
    expect(view.panel.hasNext).toBe(false);
  });

  it('opens on the selected file', () => {
    const view = renderProvider(baseProps());

    act(() => view.panel.open('a'));

    expect(view.panel.isOpen).toBe(true);
    expect(view.panel.activeFile?.id).toBe('a');
  });

  it('navigates within the current page', () => {
    const view = renderProvider(baseProps());

    act(() => view.panel.open('a'));
    act(() => view.panel.next());
    expect(view.panel.activeFile?.id).toBe('b');

    act(() => view.panel.previous());
    expect(view.panel.activeFile?.id).toBe('a');
  });

  it('disables previous on the first file and next on the last', () => {
    const first = renderProvider(baseProps());
    act(() => first.panel.open('a'));
    expect(first.panel.hasPrevious).toBe(false);
    expect(first.panel.hasNext).toBe(true);

    const last = renderProvider(
      baseProps({ nominationFiles: secondPage, pagination: { pageIndex: 1, pageSize: PAGE_SIZE } }),
    );
    act(() => last.panel.open('d'));
    expect(last.panel.hasNext).toBe(false);
    expect(last.panel.hasPrevious).toBe(true);
  });

  it('crosses to the next page and selects its first file once loaded', () => {
    const onPageChange = vi.fn();
    const view = renderProvider(baseProps({ onPageChange }));

    act(() => view.panel.open('b'));
    act(() => view.panel.next());

    expect(onPageChange).toHaveBeenCalledWith(1);
    expect(view.panel.isOpen).toBe(true);

    view.rerender(
      baseProps({ onPageChange, isFetching: true, pagination: { pageIndex: 1, pageSize: PAGE_SIZE } }),
    );
    view.rerender(
      baseProps({
        onPageChange,
        nominationFiles: secondPage,
        pagination: { pageIndex: 1, pageSize: PAGE_SIZE },
      }),
    );

    expect(view.panel.activeFile?.id).toBe('c');
  });

  it('crosses to the previous page and selects its last file once loaded', () => {
    const onPageChange = vi.fn();
    const view = renderProvider(
      baseProps({
        onPageChange,
        nominationFiles: secondPage,
        pagination: { pageIndex: 1, pageSize: PAGE_SIZE },
      }),
    );

    act(() => view.panel.open('c'));
    act(() => view.panel.previous());

    expect(onPageChange).toHaveBeenCalledWith(0);

    view.rerender(
      baseProps({
        onPageChange,
        isFetching: true,
        nominationFiles: secondPage,
        pagination: { pageIndex: 0, pageSize: PAGE_SIZE },
      }),
    );
    view.rerender(baseProps({ onPageChange, pagination: { pageIndex: 0, pageSize: PAGE_SIZE } }));

    expect(view.panel.activeFile?.id).toBe('b');
  });

  it('closes and clears the active file', () => {
    const view = renderProvider(baseProps());

    act(() => view.panel.open('a'));
    act(() => view.panel.close());

    expect(view.panel.isOpen).toBe(false);
    expect(view.panel.activeFile).toBeNull();
  });

  it('drops a dossier deep link that matches no loaded file', async () => {
    const view = renderProvider(baseProps(), '?dossier=ghost');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(view.panel.activeId).toBeNull();
    expect(view.panel.isOpen).toBe(false);
  });

  it('keeps a dossier deep link while the list is still fetching', () => {
    const view = renderProvider(baseProps({ isFetching: true, nominationFiles: [] }), '?dossier=ghost');

    expect(view.panel.activeId).toBe('ghost');
  });

  it('stays open when the active file drops out of the refreshed list', async () => {
    const view = renderProvider(baseProps());

    await act(async () => {
      view.panel.open('a');
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(view.panel.isOpen).toBe(true);

    view.rerender(baseProps({ nominationFiles: makeSessionNominationFileList(['b']) }));

    expect(view.panel.isOpen).toBe(true);
    expect(view.panel.activeFile).toBeNull();
  });
});
