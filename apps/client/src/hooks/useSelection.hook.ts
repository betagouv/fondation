import React from 'react';

type Falsy = '' | false | undefined | 0;
export function useSelection<T, Key extends string>(props: {
  items: readonly T[] | undefined;
  defaultSelection?: Key[];
  toString: (item: T) => Key | Falsy;
}) {
  const [selection, setSelection] = React.useState(new Set(props.defaultSelection));
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  const selectItem = React.useCallback((item: T) => props.toString(item), []);

  React.useEffect(() => {
    if (props.defaultSelection) return;

    const init = new Set<Key>();
    for (const item of props.items ?? []) {
      const key = selectItem(item);
      if (key) init.add(key);
    }

    setSelection(init);
  }, [props.items, props.defaultSelection, selectItem]);

  const list = React.useCallback(() => Array.from(selection?.values() ?? []), [selection]);

  const has = React.useCallback(
    (item: T) => {
      const key = selectItem(item);

      if (!key) return false;
      return !!selection?.has(key);
    },
    [selectItem, selection]
  );

  const toggle = React.useCallback(
    (key: Key, select?: boolean) => {
      if (typeof select === 'boolean') {
        setSelection((s) => {
          if (!s) return s;

          if (select) s.add(key);
          else s.delete(key);

          return new Set(s);
        });
      }

      setSelection((s) => {
        if (!s) return s;

        if (s.has(key)) s.delete(key);
        else s.add(key);

        return new Set(s);
      });
    },
    [setSelection]
  );

  const apiProps = React.useMemo(
    () => ({
      size: selection?.size ?? 0,
      hasAll: (selection?.size ?? 0) > 0 && (props.items?.length ?? 0) === selection?.size,
      hasSome: (selection?.size ?? 0) > 0,
      hasNone: (selection?.size ?? 0) === 0
    }),
    [props.items, selection]
  );

  const toggleAll = React.useCallback(() => {
    if (apiProps.hasAll) setSelection(new Set());
    else {
      setSelection(() => {
        const set = new Set<Key>();
        for (const item of props.items ?? []) {
          const key = selectItem(item);
          if (key) set.add(key);
        }
        return set;
      });
    }
  }, [props.items, selectItem, setSelection, apiProps]);

  return { ...apiProps, toggle, has, list, toggleAll };
}
