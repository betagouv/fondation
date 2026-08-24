import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useAwaitableModal } from './useAwaitableModal';

describe('useAwaitableModal', () => {
  it('starts idle', () => {
    const { result } = renderHook(() => useAwaitableModal<string, boolean>(false));

    expect(result.current.state).toEqual({ status: 'idle' });
  });

  it('resolves the promise with the answer', async () => {
    const { result } = renderHook(() => useAwaitableModal<string, boolean>(false));

    let asked!: Promise<boolean>;
    act(() => {
      asked = result.current.ask('Supprimer ?');
    });
    expect(result.current.state).toMatchObject({ question: 'Supprimer ?', status: 'asking' });

    act(() => result.current.answer(true));

    await expect(asked).resolves.toBe(true);
    expect(result.current.state).toMatchObject({ status: 'answered' });
  });

  it('settles a superseded question instead of leaving it pending', async () => {
    const { result } = renderHook(() => useAwaitableModal<string, boolean>(false));

    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    act(() => {
      first = result.current.ask('Première');
      second = result.current.ask('Seconde');
    });

    await expect(first).resolves.toBe(false);
    expect(result.current.state).toMatchObject({ question: 'Seconde', status: 'asking' });

    act(() => result.current.answer(true));
    await expect(second).resolves.toBe(true);
  });

  it('gives every question its own id, so callers can key a component on it', () => {
    const { result } = renderHook(() => useAwaitableModal<string, boolean>(false));

    act(() => void result.current.ask('Première'));
    expect(result.current.state).toMatchObject({ id: 1, question: 'Première', status: 'asking' });

    act(() => result.current.answer(true));
    act(() => void result.current.ask('Seconde'));

    expect(result.current.state).toMatchObject({ id: 2, question: 'Seconde', status: 'asking' });
  });

  it('ignores an answer once the question is settled', async () => {
    const { result } = renderHook(() => useAwaitableModal<string, boolean>(false));

    let asked!: Promise<boolean>;
    act(() => {
      asked = result.current.ask('Supprimer ?');
    });

    act(() => result.current.answer(true));
    act(() => result.current.answer(false));

    await expect(asked).resolves.toBe(true);
  });

  it('keeps a question asked while the previous one was still fading out', () => {
    const { result } = renderHook(() => useAwaitableModal<string, boolean>(false));

    act(() => void result.current.ask('Première'));
    act(() => result.current.answer(true));

    // the fade timer fires after `ask`, React having not run its cleanup yet
    act(() => {
      void result.current.ask('Seconde');
      result.current.forget();
    });

    expect(result.current.state).toMatchObject({ question: 'Seconde', status: 'asking' });
  });

  it('forgets the question once the modal finished closing', () => {
    const { result } = renderHook(() => useAwaitableModal<string, boolean>(false));

    act(() => void result.current.ask('Supprimer ?'));
    act(() => result.current.answer(true));
    act(() => result.current.forget());

    expect(result.current.state).toEqual({ status: 'idle' });
  });
});
