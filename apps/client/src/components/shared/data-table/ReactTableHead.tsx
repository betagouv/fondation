import type { RiIconClassName } from '@codegouvfr/react-dsfr';
import Button from '@codegouvfr/react-dsfr/Button';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { flexRender, type RowData, type Table } from '@tanstack/react-table';
import clsx from 'clsx';
import React from 'react';

function IndeterminateCheckbox(
  props: React.PropsWithChildren<{
    checked: boolean;
    indeterminate: boolean;
    small: boolean;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
  }>
) {
  const checkboxRef = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = props.checked && props.indeterminate;
    }
  }, [checkboxRef, props.indeterminate, props.checked]);

  return (
    <Checkbox
      small
      options={[
        {
          label: props.children,
          nativeInputProps: {
            checked: props.checked,
            onChange: props.onChange,
            ref: checkboxRef
          }
        }
      ]}
    ></Checkbox>
  );
}

/** @internal */
export function ReactTableHead<Data extends RowData>(props: { table: Table<Data> }) {
  return (
    <thead>
      {props.table.getHeaderGroups().map((group) => (
        <tr key={group.id}>
          {props.table.options.enableRowSelection ? (
            <th className={clsx('w-8', cx('fr-cell--fixed'))}>
              {props.table.options.meta?.allRowsSelectionEnabled ? (
                <IndeterminateCheckbox
                  small
                  checked={props.table.getIsAllRowsSelected()}
                  indeterminate={props.table.getIsSomeRowsSelected()}
                  onChange={props.table.getToggleAllRowsSelectedHandler()}
                >
                  {props.table.getIsAllRowsSelected()
                    ? `Dé-sélectionner toutes les lignes`
                    : `Sélectionner toutes les lignes`}
                </IndeterminateCheckbox>
              ) : null}
            </th>
          ) : null}

          {group.headers.map((header) => {
            const { size } = header.column.columnDef.meta ?? {};
            const classNames = cx({
              'fr-col--xs': size === 'xs',
              'fr-col--sm': size === 'sm',
              'fr-col--md': size === 'md',
              'fr-col--lg': size === 'lg'
            });
            const styles = size?.endsWith('%') ? { width: size } : undefined;

            if (!header.column.getCanSort()) {
              return (
                <th className={classNames} style={styles} key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              );
            }

            const nextDirection = header.column.getNextSortingOrder();
            const direction = header.column.getIsSorted();
            const ariaSort =
              direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : undefined;

            return (
              <th key={header.id} style={{ paddingLeft: 0 }} className={classNames} aria-sort={ariaSort}>
                <Button
                  size="small"
                  iconPosition="right"
                  priority="tertiary no outline"
                  title={
                    nextDirection === 'asc'
                      ? `trier par ordre croissant`
                      : nextDirection === 'desc'
                        ? `trier par ordre décroissant`
                        : `revenir au tri par défaut`
                  }
                  onClick={() => {
                    header.column.toggleSorting();
                  }}
                  iconId={
                    (direction === 'asc'
                      ? 'ri-sort-desc'
                      : direction === 'desc'
                        ? 'ri-sort-asc'
                        : undefined) as unknown as RiIconClassName
                  }
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </Button>
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
}
