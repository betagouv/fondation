import { flexRender, type RowData, type Table } from '@tanstack/react-table';
import type { RiIconClassName } from '@codegouvfr/react-dsfr';
import Button from '@codegouvfr/react-dsfr/Button';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import React from 'react';

function IndeterminateCheckbox(props: {
  checked: boolean;
  indeterminate: boolean;
  small: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}) {
  const checkboxRef = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = props.checked && props.indeterminate;
    }
  }, [checkboxRef, props.indeterminate, props.checked]);

  return (
    <Checkbox
      small={props.small}
      options={[
        {
          label: '',
          nativeInputProps: { checked: props.checked, onChange: props.onChange },
          // eslint-disable-next-line
          // @ts-expect-error
          ref: checkboxRef
        }
      ]}
    />
  );
}

/** @internal */
export function ReactTableHead<Data extends RowData>(props: { table: Table<Data> }) {
  return (
    <thead>
      {props.table.getHeaderGroups().map((group) => (
        <tr key={group.id}>
          {props.table.options.enableRowSelection !== false ? (
            <th className="fr-col--xs">
              {props.table.options.meta?.columnSelection?.allRowSelectionEnabled ? (
                <IndeterminateCheckbox
                  small
                  checked={props.table.getIsAllRowsSelected()}
                  indeterminate={props.table.getIsSomeRowsSelected()}
                  onChange={props.table.getToggleAllRowsSelectedHandler()}
                />
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

            const direction = header.column.getIsSorted();
            const ariaSort =
              direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : undefined;

            return (
              <th key={header.id} className={classNames} aria-sort={ariaSort}>
                <Button
                  size="small"
                  iconPosition="right"
                  priority="tertiary no outline"
                  iconId={
                    (direction === 'asc'
                      ? 'ri-sort-asc'
                      : direction === 'desc'
                        ? 'ri-sort-desc'
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
