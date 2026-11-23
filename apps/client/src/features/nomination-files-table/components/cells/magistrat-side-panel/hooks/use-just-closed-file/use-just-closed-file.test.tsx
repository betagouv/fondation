import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useJustClosedFile } from './use-just-closed-file.hook';

describe('useJustClosedFile', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const render = () =>
    renderHook(({ activeId }) => useJustClosedFile(activeId), {
      initialProps: { activeId: 'file-1' as string | null },
    });

  it('should give the file just closed for a second', () => {
    const { rerender, result } = render();

    rerender({ activeId: null });
    expect(result.current).toBe('file-1');

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBeNull();
  });

  it('should give nothing while a file is open', () => {
    const { rerender, result } = render();

    rerender({ activeId: null });
    rerender({ activeId: 'file-2' });

    expect(result.current).toBeNull();
  });
});
