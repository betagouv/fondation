import { useCallback } from 'react';

function fillPendingTab(handle: Window, pending: { message: string; title: string }) {
  try {
    const { document: tab } = handle;
    tab.documentElement.lang = 'fr';
    tab.documentElement.style.colorScheme = 'light dark';
    tab.title = pending.title;

    const paragraph = tab.createElement('p');
    paragraph.textContent = pending.message;
    paragraph.style.cssText = 'color: CanvasText; font-family: system-ui, sans-serif; margin: 2rem';

    if (tab.body) {
      tab.body.style.cssText = 'background: Canvas; margin: 0';
      tab.body.appendChild(paragraph);
    }
  } catch {
    // an unwritable blank tab is not worth failing the navigation for
  }
}

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

  const openDeferred = useCallback(
    (pending?: { message: string; title: string }) => {
      const handle = window.open('about:blank', '_blank');
      if (handle && pending) fillPendingTab(handle, pending);

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
    },
    [open],
  );

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
