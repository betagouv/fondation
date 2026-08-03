import { useMemo, type PropsWithChildren } from 'react';

import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { FilesSelectionContext } from './files-selection.context';

export function FilesSelectionProvider(
  props: PropsWithChildren<{
    files: readonly SessionNominationFile[];
    selection: Record<string, boolean>;
  }>,
) {
  const value = useMemo(() => {
    const selectedIds = Object.entries(props.selection)
      .filter(([_key, isSelected]) => isSelected)
      .map(([key]) => key);

    return { selectedFiles: props.files.filter(({ id }) => selectedIds.includes(id)), selectedIds };
  }, [props.files, props.selection]);

  return <FilesSelectionContext value={value}>{props.children}</FilesSelectionContext>;
}
