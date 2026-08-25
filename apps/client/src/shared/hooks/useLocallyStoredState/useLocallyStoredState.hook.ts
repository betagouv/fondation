import React from 'react';

type Jsonifiable =
  | string
  | number
  | boolean
  | null
  | { [id: string]: string | number | boolean | null | (string | number | boolean | null)[] };

const NAMESPACE = 'fondation';

const listenersByKey = new Map<string, Set<() => void>>();
const snapshots = new Map<string, { raw: string | null; value: unknown }>();

function storageKey(key: string): string {
  return `${NAMESPACE}.${key}`;
}

function emit(key: string): void {
  listenersByKey.get(key)?.forEach((listener) => listener());
}

function onStorageEvent(event: StorageEvent): void {
  if (!event.key?.startsWith(`${NAMESPACE}.`)) return;
  emit(event.key.slice(NAMESPACE.length + 1));
}

function subscribe(key: string, listener: () => void): () => void {
  const listeners = listenersByKey.get(key) ?? new Set<() => void>();
  listeners.add(listener);
  listenersByKey.set(key, listeners);
  if (listenersByKey.size === 1 && listeners.size === 1) {
    window.addEventListener('storage', onStorageEvent);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) listenersByKey.delete(key);
    if (listenersByKey.size === 0) window.removeEventListener('storage', onStorageEvent);
  };
}

function read<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(storageKey(key));
  } catch {
    return fallback;
  }

  const snapshot = snapshots.get(key);
  if (snapshot && snapshot.raw === raw) return snapshot.value as T;

  let value = fallback;
  try {
    if (raw) value = JSON.parse(raw) as T;
  } catch {
    value = fallback;
  }

  snapshots.set(key, { raw, value });
  return value;
}

function write(key: string, value: Jsonifiable): void {
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(value));
  } catch {
    /* empty */
  }
  emit(key);
}

function erase(key: string): void {
  try {
    localStorage.removeItem(storageKey(key));
  } catch {
    /* empty */
  }
  emit(key);
}

/** synchronizes react state with local storage */
export function useLocallyStoredState<T extends Jsonifiable>(options: {
  state: T;
  key: string;
}): [state: T, stateUpdater: React.Dispatch<React.SetStateAction<T>>, clear: () => void] {
  const { key } = options;
  const fallbackRef = React.useRef(options.state);

  const state = React.useSyncExternalStore(
    React.useCallback((listener) => subscribe(key, listener), [key]),
    React.useCallback(() => read(key, fallbackRef.current), [key]),
  );

  const update = React.useCallback(
    (updater: T | ((currentState: T) => T)) => {
      const next = typeof updater === 'function' ? updater(read(key, fallbackRef.current)) : (updater as T);
      write(key, next);
    },
    [key],
  );

  const clear = React.useCallback(() => erase(key), [key]);

  return [state, update, clear];
}
