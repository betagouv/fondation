import React from 'react';

type Jsonifiable =
  | string
  | number
  | boolean
  | null
  | { [id: string]: string | number | boolean | null | (string | number | boolean | null)[] };

/** synchronizes react state with local storage */
export function useLocallyStoredState<T extends Jsonifiable>(options: {
  state: T;
  key: string;
}): [state: T, stateUpdater: React.Dispatch<React.SetStateAction<T>>, clear: () => void] {
  const [state, setReactState] = React.useState<T>(readLocalStorage(options.key) ?? options.state);

  const update = React.useCallback(
    (updater: T | ((currentState: T) => T)) => {
      const next = typeof updater === 'function' ? updater(state) : updater;
      writeLocalStorage(options.key, next);
      setReactState(next);
    },
    [state, options.key, setReactState],
  );

  const clear = React.useCallback(() => {
    clearLocalStorage(options.key);
  }, [options.key]);

  return [state, update, clear];
}

const NAMESPACE = 'fondation';

function readLocalStorage<T>(key: string): T | undefined {
  const value = localStorage.getItem(`${NAMESPACE}.${key}`);
  return value ? JSON.parse(value) : undefined;
}

function writeLocalStorage(key: string, value: Jsonifiable): undefined {
  localStorage.setItem(`${NAMESPACE}.${key}`, JSON.stringify(value));
}

function clearLocalStorage(key: string): void {
  localStorage.removeItem(`${NAMESPACE}.${key}`);
}
