import React from 'react';

export function useMonoSelection<T extends { id: string }>(options: {
  items: T[] | undefined;
  defaultValueId?: string | null;
  onSelect: (item: T | null) => unknown;
}) {
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  const onChange = React.useCallback((item: T | null) => options.onSelect(item), []);

  const [selection, setSelection] = React.useState<T | null>(null);
  const select = React.useCallback(
    (id: T | string | null) => {
      const item = id
        ? typeof id === 'string'
          ? (options.items?.find((x) => x.id === id) ?? null)
          : id
        : null;

      setSelection(item);
      onChange(item);
    },
    [options.items, setSelection, onChange]
  );

  React.useEffect(() => {
    if (!selection && options.defaultValueId) {
      const item = options.items?.find(({ id }) => id === options.defaultValueId);
      if (item) select(item.id);
      return;
    }

    if (!selection && options.items && options.items.length > 0) {
      select(options.items[0].id);
    }
  }, [selection, options.items, options.defaultValueId, select]);

  return { selection, select };
}
