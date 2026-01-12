import { flexRender, type RowData, type Table } from '@tanstack/react-table';
import clsx from 'clsx';
import type { PropsWithChildren } from 'react';

import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';

function ReactTableBodyPlaceholder<Data extends RowData>(props: PropsWithChildren<{ table: Table<Data> }>) {
  const rowCount = props.table.getFilteredRowModel().rows.length;
  const canSelectRow = props.table.options.enableRowSelection;
  const { length: columnsCount } = props.table.getVisibleLeafColumns();

  if (!props.children || rowCount > 0) return null;

  return (
    <tr>
      <td
        colSpan={columnsCount + (canSelectRow ? 1 : 0)}
        className={clsx({ 'text-gray-600': typeof props.children === 'string' })}
        style={{ textAlign: typeof props.children === 'string' ? 'center' : undefined }}
      >
        {props.children}
      </td>
    </tr>
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
      {props.table.getRowModel().rows.map((row, index) => (
        <tr key={row.id} aria-selected={canSelectRow ? row.getIsSelected() : undefined}>
          {canSelectRow ? (
            <td className={cx('fr-cell--fixed')}>
              <Checkbox
                small
                options={[
                  {
                    label: `Sélectionner la ligne ${index}`,
                    nativeInputProps: {
                      checked: row.getIsSelected(),
                      disabled: !row.getCanSelect(),
                      onChange: row.getToggleSelectedHandler()
                    }
                  }
                ]}
              />
            </td>
          ) : null}

          {row.getVisibleCells().map((cell) => {
            const classNames = cx({
              'fr-cell--multiline': cell.column.columnDef.meta?.multiline !== false
            });

            return (
              <td className={classNames} key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            );
          })}
        </tr>
      ))}

      <ReactTableBodyPlaceholder table={props.table}>{props.placeholder}</ReactTableBodyPlaceholder>
    </tbody>
  );
}
