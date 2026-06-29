import { type ColumnDef, type RowData } from '@tanstack/react-table';
import { useMemo, useRef } from 'react';

import { Checkbox } from '../Checkbox';

const SELECTION_COLUMN_SIZE = 48;

export function useSelectionColumn<Data extends RowData>(): ColumnDef<Data> {
  const lastSelectedRef = useRef<string | null>(null);

  return useMemo(
    () => ({
      enableSorting: false,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          indeterminate={table.getIsSomeRowsSelected()}
          label={
            table.getIsAllRowsSelected()
              ? 'Désélectionner toutes les lignes'
              : 'Sélectionner toutes les lignes'
          }
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row, table }) => (
        <Checkbox
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          label={`Sélectionner la ligne ${row.index + 1}`}
          onChange={(event) => {
            const shouldSelect = event.currentTarget.checked;
            const hasShift = (event.nativeEvent as MouseEvent).shiftKey;
            const last = lastSelectedRef.current;

            if (hasShift && last) {
              const rows = table.getRowModel().rows;
              const lastIndex = table.getRow(last).index;
              const [from, to] = [lastIndex, row.index].sort((a, b) => a - b);
              table.setRowSelection((selection) => ({
                ...selection,
                ...Object.fromEntries(rows.slice(from, to + 1).map((r) => [r.id, shouldSelect])),
              }));
            } else {
              row.toggleSelected(shouldSelect);
            }

            lastSelectedRef.current = row.id;
          }}
        />
      ),
      id: 'select',
      meta: { sticky: true },
      size: SELECTION_COLUMN_SIZE,
    }),
    [],
  );
}
