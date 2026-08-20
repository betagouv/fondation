import { useCallback } from 'react';

export function useTab() {
  const open = useCallback((url: URL | string) => {
    const $a = document.createElement('a');
    $a.href = url.toString();
    $a.rel = 'noopener';
    $a.target = '_blank';
    $a.style.display = 'none';

    document.body.appendChild($a);
    $a.click();
    $a.remove();
  }, []);

  const openDeferred = useCallback(() => {
    const handle = window.open('about:blank', '_blank');

    return {
      cancel: () => handle?.close(),
      settle: (url: URL | string) => {
        if (!handle) return open(url);

        try {
          handle.location.replace(url.toString());
        } catch {
          handle.close();
          open(url);
        }
      },
    };
  }, [open]);

  const download = useCallback((url: URL | string) => {
    const $a = document.createElement('a');
    $a.href = url.toString();
    $a.rel = 'noopener';
    $a.download = '';
    $a.style.display = 'none';

    document.body.appendChild($a);
    $a.click();
    $a.remove();
  }, []);

  return { open, openDeferred, download };
}
