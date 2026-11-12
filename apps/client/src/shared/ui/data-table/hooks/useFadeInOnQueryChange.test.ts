import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useFadeInOnQueryChange } from './useFadeInOnQueryChange';

function renderFade(initialProps: { query: string; rows: unknown }) {
  const rowGroup = { current: document.createElement('div') };
  const view = renderHook(({ query, rows }) => useFadeInOnQueryChange(rowGroup, query, rows), {
    initialProps,
  });
  return { ...view, fades: () => rowGroup.current.classList.contains('motion-safe:animate-fade-in') };
}

describe('useFadeInOnQueryChange', () => {
  it('fades the rows a new query brings in, once they arrive', () => {
    const shownRows = ['first'];
    const { fades, rerender } = renderFade({ query: 'a', rows: shownRows });

    rerender({ query: 'b', rows: shownRows });
    expect(fades()).toBe(false);

    rerender({ query: 'b', rows: ['second'] });
    expect(fades()).toBe(true);
  });

  it('does not fade the rows a refetch or a next page brings in', () => {
    const { fades, rerender } = renderFade({ query: 'a', rows: ['first'] });

    rerender({ query: 'a', rows: ['first', 'second'] });
    expect(fades()).toBe(false);
  });
});
