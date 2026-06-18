import React from 'react';

export function useTab() {
  const open = React.useCallback((url: URL | string) => {
    const $a = document.createElement('a');
    $a.href = url.toString();
    $a.rel = 'noopener';
    $a.target = '_blank';
    $a.style.display = 'none';

    document.body.appendChild($a);
    $a.click();
    $a.remove();
  }, []);

  return { open };
}
