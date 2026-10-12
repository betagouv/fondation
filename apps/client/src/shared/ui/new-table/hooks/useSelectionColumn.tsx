import { type ColumnDef, type Row, type RowData } from '@tanstack/react-table';
import { useMemo, useRef } from 'react';
import { useIntl } from 'react-intl';

import { Checkbox } from '../Checkbox';
import { Tooltip } from '@/shared/ui/tooltip';

const SELECTION_COLUMN_SIZE = 48;

export function useSelectionColumn<Data extends RowData>(options?: {
  header?: ColumnDef<Data>['header'];
  lockedLabel?: (row: Row<Data>) => string;
}): ColumnDef<Data> {
  const { formatMessage } = useIntl();

  const lastSelectedRef = useRef<string | null>(null);
  const lockedLabel = options?.lockedLabel;
  const header = options?.header;

  return useMemo(
    () => ({
      cell: ({ row, table }) => {
        const locked = row.getCanSelect() ? undefined : lockedLabel?.(row);
        const checkbox = (
          <Checkbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            label={
              locked
                ? formatMessage(
                    { defaultMessage: 'Ligne {line} : {reason}' },
                    { line: row.index + 1, reason: locked },
                  )
                : formatMessage({ defaultMessage: 'Sélectionner la ligne {line}' }, { line: row.index + 1 })
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

        if (!locked) return checkbox;

        return <Tooltip label={locked}>{checkbox}</Tooltip>;
      },
      enableSorting: false,
      header:
        header ??
        (({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getSelectedRowModel().rows.length > 0 && !table.getIsAllRowsSelected()}
            label={
              table.getIsAllRowsSelected()
                ? formatMessage({ defaultMessage: 'Désélectionner toutes les lignes' })
                : formatMessage({ defaultMessage: 'Sélectionner toutes les lignes' })
            }
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        )),
      id: 'select',
      meta: {
        cellBackground: (row) =>
          !row.getCanSelect() && lockedLabel ? 'bg-(--background-contrast-grey)' : undefined,
        cellClassName: () => 'justify-center',
        headerClassName: 'justify-center',
        sticky: true,
      },
      size: SELECTION_COLUMN_SIZE,
    }),
    [formatMessage, header, lockedLabel],
  );
}
