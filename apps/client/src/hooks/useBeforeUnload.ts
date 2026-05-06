import React from 'react';

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
