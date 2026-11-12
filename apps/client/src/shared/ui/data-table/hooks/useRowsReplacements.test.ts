import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useRowsReplacements } from './useRowsReplacements';

describe('useRowsReplacements', () => {
  it('counts the rows replaced, not the rows of a next page', () => {
    const { rerender, result } = renderHook(({ rowIds }) => useRowsReplacements(rowIds), {
      initialProps: { rowIds: ['a', 'b'] },
    });

    rerender({ rowIds: ['a', 'b', 'c'] });
    expect(result.current).toBe(0);

    rerender({ rowIds: ['c'] });
    expect(result.current).toBe(1);

    rerender({ rowIds: [] });
    expect(result.current).toBe(2);
  });

  it('counts the rows shown after a load that kept none, but not the first ones', () => {
    const { rerender, result } = renderHook(({ rowIds }) => useRowsReplacements(rowIds), {
      initialProps: { rowIds: [] as string[] },
    });

    rerender({ rowIds: ['a'] });
    expect(result.current).toBe(0);

    rerender({ rowIds: [] });
    rerender({ rowIds: ['b'] });
    expect(result.current).toBe(2);
  });
});
