import React from 'react';
import { FilesSelectionContext } from './files-selection.context';

export function FilesSelectionProvider(
  props: React.PropsWithChildren<{ selection: Record<string, boolean> }>
) {
  const selectedIds = React.useMemo(
    () =>
      Object.entries(props.selection)
        .filter(([_key, isSelected]) => isSelected) // eslint-disable-line @typescript-eslint/no-unused-vars
        .map(([key]) => key),
    [props.selection]
  );

  return <FilesSelectionContext value={{ selectedIds }}>{props.children}</FilesSelectionContext>;
}
