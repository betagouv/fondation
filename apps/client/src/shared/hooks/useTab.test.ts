import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useTab } from './useTab';

afterEach(() => vi.restoreAllMocks());

describe('useTab.download', () => {
  it('triggers a download through a transient anchor', () => {
    const appended: HTMLAnchorElement[] = [];
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      appended.push(node as HTMLAnchorElement);
      return node;
    });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const { result } = renderHook(() => useTab());
    act(() => result.current.download('https://files/report.pdf?download'));

    expect(click).toHaveBeenCalledOnce();
    const anchor = appended.find((node) => node.tagName === 'A')!;
    expect(anchor.href).toBe('https://files/report.pdf?download');
    expect(anchor.download).toBe('');
    expect(anchor.rel).toBe('noopener');
  });

  it('accepts a URL instance', () => {
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const { result } = renderHook(() => useTab());
    act(() => result.current.download(new URL('https://files/report.pdf')));

    expect(click).toHaveBeenCalledOnce();
  });
});
