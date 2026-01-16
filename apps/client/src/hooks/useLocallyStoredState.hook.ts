import React from 'react';

type Jsonifiable = string | number | boolean | { [id: string]: string | number | boolean | null };

/** synchronizes react state with local storage */
export function useLocallyStoredState<T extends Jsonifiable>(options: {
  state: T;
  key: string;
}): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setReactState] = React.useState<T>(readLocalStorage(options.key) ?? options.state);

  const update = React.useCallback(
    (updater: T | ((currentState: T) => T)) => {
      const next = typeof updater === 'function' ? updater(state) : updater;
      writeLocalStorage(options.key, next);
      setReactState(next);
    },
    [state, options.key, setReactState]
  );

  return [state, update];
}

const NAMESPACE = 'fondation';

function readLocalStorage<T>(key: string): T | undefined {
  const value = localStorage.getItem(`${NAMESPACE}.${key}`);
  return value ? JSON.parse(value) : undefined;
}

function writeLocalStorage<T extends Jsonifiable>(key: string, value: T): undefined {
  localStorage.setItem(`${NAMESPACE}.${key}`, JSON.stringify(value));
}
