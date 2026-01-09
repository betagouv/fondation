import { flexRender, type RowData, type Table } from '@tanstack/react-table';

import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';

/** @internal */
export function ReactTableBody<Data extends RowData>(props: { table: Table<Data> }) {
  const canSelectRow = props.table.options.enableRowSelection !== false;
  return (
    <tbody>
      {props.table.getRowModel().rows.map((row) => (
        <tr key={row.id} aria-selected={canSelectRow ? row.getIsSelected() : undefined}>
          {canSelectRow ? (
            <td>
              <Checkbox
                small
                options={[
                  {
                    label: '',
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
    </tbody>
  );
}
