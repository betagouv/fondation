import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { flexRender, type Row, type RowData, type Table } from '@tanstack/react-table';
import clsx from 'clsx';
import type { PropsWithChildren } from 'react';
import React from 'react';

function ReactTableBodyPlaceholder<Data extends RowData>(props: PropsWithChildren<{ table: Table<Data> }>) {
  const rowCount = props.table.getFilteredRowModel().rows.length;
  const canSelectRow = props.table.options.enableRowSelection;
  const { length: columnsCount } = props.table.getVisibleLeafColumns();

  if (!props.children || rowCount > 0) return null;

  return (
    <tr>
      <td
        colSpan={columnsCount + (canSelectRow ? 1 : 0)}
        className={clsx({ 'text-(--text-mention-grey)': typeof props.children === 'string' })}
        style={{ textAlign: typeof props.children === 'string' ? 'center' : undefined }}
      >
        {props.children}
      </td>
    </tr>
  );
}

const ReactTableShiftSelectContext = React.createContext<{
  lastSelected: string | null;
  setLastSelected: (id: string | null) => void;
}>(null as any); // oxlint-disable-line typescript/no-explicit-any

function ReactTableShiftSelectProvider<Data extends RowData>(
  props: React.PropsWithChildren<{ table: Table<Data> }>,
) {
  const [lastSelected, setLastSelected] = React.useState<string | null>(null);

  const canSelectRows = props.table.options.enableRowSelection;
  React.useEffect(() => {
    return () => {
      setLastSelected(null);
    };
  }, [canSelectRows]);

  return (
    <ReactTableShiftSelectContext value={{ lastSelected, setLastSelected }}>
      {props.children}
    </ReactTableShiftSelectContext>
  );
}

function useShiftSelection() {
  const ctx = React.useContext(ReactTableShiftSelectContext);
  if (!ctx) throw new Error(`unknown context ReactTableShiftSelectContext`);
  return ctx;
}

function ReactTableCheckbox<Data extends RowData>(props: { table: Table<Data>; row: Row<Data> }) {
  const { table, row } = props;
  const { lastSelected, setLastSelected } = useShiftSelection();

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const shouldSelect = e.currentTarget.checked;
      const hasShift = (e.nativeEvent as MouseEvent).shiftKey;

      if (!lastSelected || !hasShift) {
        row.toggleSelected(shouldSelect);
      } else {
        const { index: lastRowIndex } = table.getRow(lastSelected);
        const [min, max] = [lastRowIndex, row.index].sort((a, b) => a - b);
        const rowIds = table
          .getRowModel()
          .rows.slice(min, max + 1)
          .filter((r) => r.getCanSelect())
          .map((r) => r.id);

        table.setRowSelection((selection) => {
          const next = { ...selection };
          for (const id of rowIds) {
            if (shouldSelect) next[id] = true;
            else delete next[id];
          }
          return next;
        });
      }

      setLastSelected(row.id);
    },
    [table, row, lastSelected, setLastSelected],
  );

  return (
    <Checkbox
      small
      options={[
        {
          label: `Sélectionner la ligne ${row.index + 1}`,
          nativeInputProps: {
            onChange,
            checked: row.getIsSelected(),
            disabled: !row.getCanSelect(),
          },
        },
      ]}
    />
  );
}

/** @internal */
export function ReactTableBody<Data extends RowData>(props: {
  table: Table<Data>;
  placeholder?: React.ReactNode;
}) {
  const canSelectRow = props.table.options.enableRowSelection;
  return (
    <tbody>
      <ReactTableShiftSelectProvider table={props.table}>
        {props.table.getRowModel().rows.map((row) => (
          <tr key={row.id} aria-selected={canSelectRow ? row.getIsSelected() : undefined}>
            {canSelectRow ? (
              <td className={cx('fr-cell--fixed')}>
                <ReactTableCheckbox table={props.table} row={row} />
              </td>
            ) : null}

            {row.getVisibleCells().map((cell) => {
              const classNames = cx({
                'fr-cell--multiline': cell.column.columnDef.meta?.multiline !== false,
              });

              return (
                <td className={classNames} key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              );
            })}
          </tr>
        ))}
      </ReactTableShiftSelectProvider>

      <ReactTableBodyPlaceholder table={props.table}>{props.placeholder}</ReactTableBodyPlaceholder>
    </tbody>
  );
}
