import React from 'react';

export function useBeforeUnload(action: (event: BeforeUnloadEvent) => unknown): void {
  // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  const callback = React.useCallback(action, []);

  React.useEffect(() => {
    window.addEventListener('beforeunload', callback);

    return () => {
      window.removeEventListener('beforeunload', callback);
    };
  });
}

export function useBeforeUnloadOrUnmount(action: () => unknown): void {
  // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  const callback = React.useCallback(action, []);

  React.useEffect(() => {
    window.addEventListener('beforeunload', callback);

    return () => {
      window.removeEventListener('beforeunload', callback);
      callback();
    };
  }, [callback]);
}
