import { act, render } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, it, vi } from 'vitest';

import { useSidePanel, type SidePanelContextValue } from '../../context/side-panel.context';
import { SidePanelProvider } from '../../context/SidePanelProvider';
import { makeSessionNominationFileList } from '@/test-utils/factories/session-nomination-file.factory';

import { useUnsavedGuard } from './use-unsaved-guard.hook';

// nuqs writes the dossier param asynchronously: let it settle before reading or re-rendering
function flushQueryState(run: () => void) {
  return act(async () => {
    run();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function setup() {
  const panelRef: { current: SidePanelContextValue | null } = { current: null };
  const warnRef: { current: boolean } = { current: false };

  function Consumer() {
    panelRef.current = useSidePanel();
    return null;
  }
  function Guarded(props: { isDirty: boolean }) {
    warnRef.current = useUnsavedGuard('test', props.isDirty);
    return null;
  }

  const ui = (isDirty: boolean) => (
    <NuqsTestingAdapter hasMemory>
      <SidePanelProvider
        isFetching={false}
        nominationFiles={makeSessionNominationFileList(['a', 'b'])}
        onPageChange={vi.fn()}
        pagination={{ pageIndex: 0, pageSize: 2 }}
        totalCount={2}
      >
        <Consumer />
        <Guarded isDirty={isDirty} />
      </SidePanelProvider>
    </NuqsTestingAdapter>
  );

  const view = render(ui(false));
  return {
    panel: () => panelRef.current!,
    showWarning: () => warnRef.current,
    setDirty: (isDirty: boolean) => flushQueryState(() => view.rerender(ui(isDirty))),
  };
}

describe('useUnsavedGuard', () => {
  it('lets navigation through and stays silent while not dirty', async () => {
    const t = setup();
    await flushQueryState(() => t.panel().open('a'));
    await flushQueryState(() => t.panel().next());

    expect(t.panel().activeFile?.id).toBe('b');
    expect(t.panel().isLeaveBlocked).toBe(false);
    expect(t.showWarning()).toBe(false);
  });

  it('blocks navigation and raises the warning once a leave is attempted while dirty', async () => {
    const t = setup();
    await flushQueryState(() => t.panel().open('a'));
    await t.setDirty(true);

    expect(t.showWarning()).toBe(false);

    await flushQueryState(() => t.panel().next());

    expect(t.panel().activeFile?.id).toBe('a');
    expect(t.panel().isLeaveBlocked).toBe(true);
    expect(t.showWarning()).toBe(true);
  });

  it('clears the warning and unblocks once changes are resolved', async () => {
    const t = setup();
    await flushQueryState(() => t.panel().open('a'));
    await t.setDirty(true);
    await flushQueryState(() => t.panel().next());

    expect(t.panel().isLeaveBlocked).toBe(true);

    await t.setDirty(false);

    expect(t.showWarning()).toBe(false);
    expect(t.panel().isLeaveBlocked).toBe(false);

    await flushQueryState(() => t.panel().next());
    expect(t.panel().activeFile?.id).toBe('b');
  });

  it('unregisters its guard and releases the block on unmount', async () => {
    const panelRef: { current: SidePanelContextValue | null } = { current: null };
    function Consumer() {
      panelRef.current = useSidePanel();
      return null;
    }
    function Guarded() {
      useUnsavedGuard('test', true);
      return null;
    }
    const ui = (mounted: boolean) => (
      <NuqsTestingAdapter hasMemory>
        <SidePanelProvider
          isFetching={false}
          nominationFiles={makeSessionNominationFileList(['a', 'b'])}
          onPageChange={vi.fn()}
          pagination={{ pageIndex: 0, pageSize: 2 }}
          totalCount={2}
        >
          <Consumer />
          {mounted && <Guarded />}
        </SidePanelProvider>
      </NuqsTestingAdapter>
    );
    const view = render(ui(false));
    const panel = () => panelRef.current!;

    await flushQueryState(() => panel().open('a'));
    await flushQueryState(() => view.rerender(ui(true)));

    await flushQueryState(() => panel().next());
    expect(panel().activeFile?.id).toBe('a');
    expect(panel().isLeaveBlocked).toBe(true);

    await flushQueryState(() => view.rerender(ui(false)));

    expect(panel().isLeaveBlocked).toBe(false);
    await flushQueryState(() => panel().next());
    expect(panel().activeFile?.id).toBe('b');
  });
});
