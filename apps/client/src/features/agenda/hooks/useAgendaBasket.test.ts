import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAgendaBasket } from './useAgendaBasket.hook';

describe('useAgendaBasket', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should accumulate files without duplicating them', () => {
    const { result } = renderHook(() => useAgendaBasket('session-1'));

    act(() => result.current.add(['dossier-1', 'dossier-2']));
    act(() => result.current.add(['dossier-2', 'dossier-3']));

    expect(result.current.fileIds).toEqual(['dossier-1', 'dossier-2', 'dossier-3']);
    expect(result.current.size).toBe(3);
  });

  it('should empty the basket both in memory and in the storage', () => {
    const { result } = renderHook(() => useAgendaBasket('session-1'));

    act(() => result.current.add(['dossier-1']));
    act(() => result.current.clear());

    expect(result.current.isEmpty).toBe(true);
    expect(localStorage.getItem('fondation.agenda-basket.session-1')).toBeNull();
  });
});
