import React from 'react';

import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { FilesSelectionContext } from './files-selection.context';

export function FilesSelectionProvider(
  props: React.PropsWithChildren<{
    files: readonly SessionNominationFile[];
    selection: Record<string, boolean>;
  }>,
) {
  const selectedIds = React.useMemo(
    () =>
      Object.entries(props.selection)
        .filter(([_key, isSelected]) => isSelected)
        .map(([key]) => key),
    [props.selection],
  );

  const selectedFiles = React.useMemo(
    () => props.files.filter(({ id }) => selectedIds.includes(id)),
    [props.files, selectedIds],
  );

  return (
    <FilesSelectionContext value={{ selectedFiles, selectedIds }}>{props.children}</FilesSelectionContext>
  );
}
