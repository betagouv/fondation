import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useMagistratPanel, type MagistratPanelContextValue } from '../../context/magistrat-panel.context';
import { MagistratPanelProvider } from '../../context/MagistratPanelProvider';
import { makeSessionNominationFileList } from '@/test-utils/factories/session-nomination-file.factory';

import { useUnsavedGuard } from './use-unsaved-guard.hook';

function setup() {
  const panelRef: { current: MagistratPanelContextValue | null } = { current: null };
  const warnRef: { current: boolean } = { current: false };

  function Consumer() {
    panelRef.current = useMagistratPanel();
    return null;
  }
  function Guarded(props: { isDirty: boolean }) {
    warnRef.current = useUnsavedGuard('test', props.isDirty);
    return null;
  }

  const ui = (isDirty: boolean) => (
    <MagistratPanelProvider
      isFetching={false}
      nominationFiles={makeSessionNominationFileList(['a', 'b'])}
      onPageChange={vi.fn()}
      pagination={{ pageIndex: 0, pageSize: 2 }}
      totalCount={2}
    >
      <Consumer />
      <Guarded isDirty={isDirty} />
    </MagistratPanelProvider>
  );

  const view = render(ui(false));
  return {
    panel: () => panelRef.current!,
    showWarning: () => warnRef.current,
    setDirty: (isDirty: boolean) => view.rerender(ui(isDirty)),
  };
}

describe('useUnsavedGuard', () => {
  it('lets navigation through and stays silent while not dirty', () => {
    const t = setup();
    act(() => t.panel().open('a'));
    act(() => t.panel().next());

    expect(t.panel().activeFile?.id).toBe('b');
    expect(t.panel().isLeaveBlocked).toBe(false);
    expect(t.showWarning()).toBe(false);
  });

  it('blocks navigation and raises the warning once a leave is attempted while dirty', () => {
    const t = setup();
    act(() => t.panel().open('a'));
    t.setDirty(true);

    expect(t.showWarning()).toBe(false);

    act(() => t.panel().next());

    expect(t.panel().activeFile?.id).toBe('a');
    expect(t.panel().isLeaveBlocked).toBe(true);
    expect(t.showWarning()).toBe(true);
  });

  it('clears the warning and unblocks once changes are resolved', () => {
    const t = setup();
    act(() => t.panel().open('a'));
    t.setDirty(true);
    act(() => t.panel().next());

    expect(t.panel().isLeaveBlocked).toBe(true);

    t.setDirty(false);

    expect(t.showWarning()).toBe(false);
    expect(t.panel().isLeaveBlocked).toBe(false);

    act(() => t.panel().next());
    expect(t.panel().activeFile?.id).toBe('b');
  });

  it('unregisters its guard and releases the block on unmount', () => {
    const panelRef: { current: MagistratPanelContextValue | null } = { current: null };
    function Consumer() {
      panelRef.current = useMagistratPanel();
      return null;
    }
    function Guarded() {
      useUnsavedGuard('test', true);
      return null;
    }
    const ui = (mounted: boolean) => (
      <MagistratPanelProvider
        isFetching={false}
        nominationFiles={makeSessionNominationFileList(['a', 'b'])}
        onPageChange={vi.fn()}
        pagination={{ pageIndex: 0, pageSize: 2 }}
        totalCount={2}
      >
        <Consumer />
        {mounted && <Guarded />}
      </MagistratPanelProvider>
    );
    const view = render(ui(false));
    const panel = () => panelRef.current!;

    act(() => panel().open('a'));
    view.rerender(ui(true));

    act(() => panel().next());
    expect(panel().activeFile?.id).toBe('a');
    expect(panel().isLeaveBlocked).toBe(true);

    view.rerender(ui(false));

    expect(panel().isLeaveBlocked).toBe(false);
    act(() => panel().next());
    expect(panel().activeFile?.id).toBe('b');
  });
});
