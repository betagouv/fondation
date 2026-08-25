import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useLocallyStoredState } from './useLocallyStoredState.hook';

describe('useLocallyStoredState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should start from what the storage already holds', () => {
    localStorage.setItem('fondation.basket', JSON.stringify({ ids: ['a'] }));

    const { result } = renderHook(() =>
      useLocallyStoredState<{ ids: string[] }>({ key: 'basket', state: { ids: [] } }),
    );

    expect(result.current[0]).toEqual({ ids: ['a'] });
  });

  it('should keep every reader of the same key in sync', () => {
    const writer = renderHook(() =>
      useLocallyStoredState<{ ids: string[] }>({ key: 'basket', state: { ids: [] } }),
    );
    const reader = renderHook(() =>
      useLocallyStoredState<{ ids: string[] }>({ key: 'basket', state: { ids: [] } }),
    );

    act(() => writer.result.current[1]({ ids: ['a'] }));
    expect(reader.result.current[0]).toEqual({ ids: ['a'] });

    act(() => writer.result.current[2]());
    expect(reader.result.current[0]).toEqual({ ids: [] });
  });

  it('should fall back to the given state when the storage holds nonsense', () => {
    localStorage.setItem('fondation.basket', '{ not json');

    const { result } = renderHook(() =>
      useLocallyStoredState<{ ids: string[] }>({ key: 'basket', state: { ids: [] } }),
    );

    expect(result.current[0]).toEqual({ ids: [] });
  });
});
