import type { RowData, Table } from '@tanstack/react-table';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { DropdownFilter } from '../DropdownFilter';

import type { TableMetaFilterEnum } from './data-table.types';
import { DataTableAsyncListFilter } from './DataTableAsyncListFilter';

function DataTableEnumFilter<Data extends RowData>(props: {
  filter: TableMetaFilterEnum;
  table: Table<Data>;
}) {
  const currentFilter = (props.table
    .getState()
    .columnFilters.find(({ id }) => id === props.filter.filterId) ?? {
    id: props.filter.filterId,
    value: [],
  }) as { id: string; value: string[] };

  const options = (
    props.filter.emptyValue ? [props.filter.emptyValue].concat(props.filter.values) : props.filter.values
  ).map(({ id: value, label }) => ({ label, value }));

  const onSelectionChange = React.useCallback(
    (selection: string[]) => {
      props.table.setColumnFilters((filters) =>
        filters
          .filter((filter) => filter.id !== props.filter.filterId)
          .concat({
            id: props.filter.filterId,
            // DropdownFilter appends the value just checked: it replaces the previous one
            value: props.filter.multiple === false ? selection.slice(-1) : selection,
          }),
      );
    },
    [props.table, props.filter],
  );

  return (
    <DropdownFilter
      onSelectionChange={onSelectionChange}
      options={options}
      selectedValues={currentFilter.value}
      tagName={props.filter.label}
    />
  );
}

export function DataTableFilters<Data extends RowData>(props: { table: Table<Data> }) {
  return (
    <div className="flex items-center gap-4">
      <span>
        <FormattedMessage defaultMessage="Filtrer par" />
      </span>
      {props.table.options.columns
        .filter((col) => !!col.meta?.filters)
        .map((col) => {
          switch (col.meta?.filters?.type) {
            case 'enum':
              return (
                <DataTableEnumFilter
                  filter={col.meta.filters}
                  key={col.meta.filters.filterId}
                  table={props.table}
                />
              );
            case 'asyncList':
              return (
                <DataTableAsyncListFilter
                  filter={col.meta.filters}
                  key={col.meta.filters.filterId}
                  table={props.table}
                />
              );
            default:
              return null;
          }
        })}
    </div>
  );
}
