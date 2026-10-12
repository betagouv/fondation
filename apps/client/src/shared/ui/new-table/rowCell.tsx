import type { CellContext, RowData } from '@tanstack/react-table';
import type { ReactNode } from 'react';

/**
 * flexRender mounts a column `cell` function as a React component type: when the
 * columns are rebuilt with fresh closures, React sees new component types and
 * remounts every cell subtree, dropping their state. Declare cells with this
 * helper at module scope so their identity never changes.
 */
export function rowCell<TData extends RowData>(render: (row: TData) => ReactNode) {
  return function RowCell<TValue>(props: CellContext<TData, TValue>) {
    return render(props.row.original);
  };
}
