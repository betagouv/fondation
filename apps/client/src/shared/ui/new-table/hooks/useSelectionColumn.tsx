import { type ColumnDef, type RowData } from '@tanstack/react-table';
import { useMemo, useRef } from 'react';

import { Checkbox } from '../Checkbox';
import { Tooltip } from '@/shared/ui/tooltip';

const SELECTION_COLUMN_SIZE = 48;

export function useSelectionColumn<Data extends RowData>(options?: {
  lockedLabel?: string;
}): ColumnDef<Data> {
  const lastSelectedRef = useRef<string | null>(null);
  const lockedLabel = options?.lockedLabel;

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
      cell: ({ row, table }) => {
        const checkbox = (
          <Checkbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            label={
              row.getCanSelect() || !lockedLabel
                ? `Sélectionner la ligne ${row.index + 1}`
                : `Ligne ${row.index + 1} : ${lockedLabel}`
            }
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
                  ...Object.fromEntries(
                    rows
                      .slice(from, to + 1)
                      .filter((r) => r.getCanSelect())
                      .map((r) => [r.id, shouldSelect]),
                  ),
                }));
              } else {
                row.toggleSelected(shouldSelect);
              }

              lastSelectedRef.current = row.id;
            }}
          />
        );

        if (row.getCanSelect() || !lockedLabel) return checkbox;

        return (
          <Tooltip className="w-full items-center self-stretch" label={lockedLabel}>
            {checkbox}
          </Tooltip>
        );
      },
      id: 'select',
      meta: {
        cellClassName: (row) =>
          !row.getCanSelect() && lockedLabel ? 'bg-(--background-contrast-grey)' : undefined,
        sticky: true,
      },
      size: SELECTION_COLUMN_SIZE,
    }),
    [lockedLabel],
  );
}
