import React from 'react';

export function useBeforeUnloadOrUnmount(action: () => unknown): void {
  // eslint-disable-next-line
  const callback = React.useCallback(action, []);

  React.useEffect(() => {
    window.addEventListener('beforeunload', callback);

    return () => {
      window.removeEventListener('beforeunload', callback);
      callback();
    };
  }, [callback]);
}
