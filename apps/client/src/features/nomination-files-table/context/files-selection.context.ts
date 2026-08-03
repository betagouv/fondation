import React from 'react';

import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

type FilesSelectionContextType = {
  selectedFiles: readonly SessionNominationFile[];
  selectedIds: readonly string[];
};
/** @internal */
export const FilesSelectionContext = React.createContext(null as unknown as FilesSelectionContextType);

export function useSelectedFileIds(): readonly string[] {
  const ctx = React.useContext(FilesSelectionContext);
  if (!ctx) throw new Error(`unknown context "FilesSelectionContext"`);

  return ctx.selectedIds;
}

export function useSelectedFiles(): readonly SessionNominationFile[] {
  const ctx = React.useContext(FilesSelectionContext);
  if (!ctx) throw new Error(`unknown context "FilesSelectionContext"`);

  return ctx.selectedFiles;
}
