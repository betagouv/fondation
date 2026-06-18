import React from 'react';

type FilesSelectionContextType = { selectedIds: readonly string[] };
/** @internal */
export const FilesSelectionContext = React.createContext(null as unknown as FilesSelectionContextType);

export function useSelectedFileIds(): readonly string[] {
  const ctx = React.useContext(FilesSelectionContext);
  if (!ctx) throw new Error(`unknown context "FilesSelectionContext"`);

  return ctx.selectedIds;
}
