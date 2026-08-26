import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useTab } from './useTab';

afterEach(() => vi.restoreAllMocks());

describe('useTab.open', () => {
  it('opens the url through a transient anchor', () => {
    const appended: HTMLAnchorElement[] = [];
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      appended.push(node as HTMLAnchorElement);
      return node;
    });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const { result } = renderHook(() => useTab());
    act(() => result.current.open('https://files/report.pdf'));

    expect(click).toHaveBeenCalledOnce();
    const anchor = appended.find((node) => node.tagName === 'A')!;
    expect(anchor.href).toBe('https://files/report.pdf');
    expect(anchor.target).toBe('_blank');
    expect(anchor.rel).toBe('noopener');
  });

  it('accepts a URL instance', () => {
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const { result } = renderHook(() => useTab());
    act(() => result.current.open(new URL('https://files/report.pdf')));

    expect(click).toHaveBeenCalledOnce();
  });
});

describe('useTab.openDeferred', () => {
  it('shows a pending message in the blank tab until the url settles', () => {
    const tabDocument = document.implementation.createHTMLDocument();
    const handle = { close: vi.fn(), document: tabDocument, location: { replace: vi.fn() } };
    vi.spyOn(window, 'open').mockReturnValue(handle as unknown as Window);

    const { result } = renderHook(() => useTab());
    const deferred = result.current.openDeferred({
      message: 'Préparation...',
      title: 'Ordre du jour',
    });

    expect(tabDocument.title).toBe('Ordre du jour');
    expect(tabDocument.body.textContent).toBe('Préparation...');
    expect(tabDocument.documentElement.style.colorScheme).toBe('light dark');

    deferred.settle('https://files/agenda.pdf');
    expect(handle.location.replace).toHaveBeenCalledWith('https://files/agenda.pdf');
  });

  it('opens a bare blank tab when no pending message is given', () => {
    const tabDocument = document.implementation.createHTMLDocument();
    const handle = { close: vi.fn(), document: tabDocument, location: { replace: vi.fn() } };
    vi.spyOn(window, 'open').mockReturnValue(handle as unknown as Window);

    const { result } = renderHook(() => useTab());
    result.current.openDeferred();

    expect(tabDocument.body.textContent).toBe('');
  });
});
