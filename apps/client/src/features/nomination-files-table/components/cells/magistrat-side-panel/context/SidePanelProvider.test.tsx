import { act, render } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, it, vi } from 'vitest';

import { makeSessionNominationFileList } from '@/test-utils/factories/session-nomination-file.factory';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { useSidePanel, type SidePanelContextValue } from './side-panel.context';
import { SidePanelProvider } from './SidePanelProvider';

type ProviderProps = {
  isFetching: boolean;
  nominationFiles: SessionNominationFile[];
  onEndReached: () => void;
  totalCount: number;
};

function renderProvider(initialProps: ProviderProps, searchParams?: string) {
  const ref: { current: SidePanelContextValue | null } = { current: null };

  function Consumer() {
    ref.current = useSidePanel();
    return null;
  }

  const view = render(
    <NuqsTestingAdapter hasMemory searchParams={searchParams}>
      <SidePanelProvider {...initialProps}>
        <Consumer />
      </SidePanelProvider>
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
          <SidePanelProvider {...props}>
            <Consumer />
          </SidePanelProvider>
        </NuqsTestingAdapter>,
      ),
  };
}

const loadedFiles = makeSessionNominationFileList(['a', 'b']);
const allFiles = makeSessionNominationFileList(['a', 'b', 'c', 'd']);

function baseProps(overrides: Partial<ProviderProps> = {}): ProviderProps {
  return {
    isFetching: false,
    nominationFiles: loadedFiles,
    onEndReached: vi.fn(),
    totalCount: 4,
    ...overrides,
  };
}

describe('SidePanelProvider', () => {
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

  it('navigates within the loaded files', () => {
    const view = renderProvider(baseProps());

    act(() => view.panel.open('a'));
    act(() => view.panel.next());
    expect(view.panel.activeFile?.id).toBe('b');

    act(() => view.panel.previous());
    expect(view.panel.activeFile?.id).toBe('a');
  });

  it('disables previous on the first file and next on the last', () => {
    const view = renderProvider(baseProps({ nominationFiles: allFiles }));

    act(() => view.panel.open('a'));
    expect(view.panel.hasPrevious).toBe(false);
    expect(view.panel.hasNext).toBe(true);

    act(() => view.panel.open('d'));
    expect(view.panel.hasNext).toBe(false);
    expect(view.panel.hasPrevious).toBe(true);
  });

  it('loads more files and selects the next one once loaded', () => {
    const onEndReached = vi.fn();
    const view = renderProvider(baseProps({ onEndReached }));

    act(() => view.panel.open('b'));
    act(() => view.panel.next());

    expect(onEndReached).toHaveBeenCalledOnce();
    expect(view.panel.isOpen).toBe(true);

    view.rerender(baseProps({ onEndReached, isFetching: true }));
    view.rerender(baseProps({ onEndReached, nominationFiles: allFiles }));

    expect(view.panel.activeFile?.id).toBe('c');
  });

  it('selects the next file served without an observable fetch', () => {
    const view = renderProvider(baseProps());

    act(() => view.panel.open('b'));
    act(() => view.panel.next());

    view.rerender(baseProps({ nominationFiles: allFiles }));

    expect(view.panel.activeFile?.id).toBe('c');
  });

  it('abandons the pending load when fetching ends without new files', () => {
    const view = renderProvider(baseProps());

    act(() => view.panel.open('b'));
    act(() => view.panel.next());

    view.rerender(baseProps({ isFetching: true }));
    view.rerender(baseProps());
    view.rerender(baseProps({ nominationFiles: allFiles }));

    expect(view.panel.activeFile).toBeNull();
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
