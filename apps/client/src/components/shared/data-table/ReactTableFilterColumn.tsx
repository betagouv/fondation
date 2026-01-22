import type { TableMetaFilterEnum } from '@/tanstack-react-table';
import type { RowData, Table } from '@tanstack/react-table';
import { DropdownFilter } from '../DropdownFilter';
import React from 'react';
import { ReactTableFilterColumnAsyncList } from './ReactTableFilterColumnAsyncList';

function ReactTableFilterEnum<Data extends RowData>(props: {
  table: Table<Data>;
  filter: TableMetaFilterEnum;
}) {
  const currentFilter = (props.table
    .getState()
    .columnFilters.find(({ id }) => id === props.filter.filterId) ?? {
    id: props.filter.filterId,
    value: []
  }) as { id: string; value: string[] };

  const options = (
    props.filter.emptyValue ? [props.filter.emptyValue].concat(props.filter.values) : props.filter.values
  ).map(({ id, label }) => ({ value: id, label }));

  const onSelectionChange = React.useCallback(
    (selection: string[]) => {
      props.table.setColumnFilters((filters) =>
        props.filter.multiple !== false
          ? filters
              .filter((filter) => filter.id !== props.filter.filterId)
              .concat({ id: props.filter.filterId, value: selection })
          : [{ id: props.filter.filterId, value: selection }]
      );
    },
    [props.table, props.filter]
  );

  return (
    <DropdownFilter
      tagName={props.filter.label}
      options={options}
      selectedValues={currentFilter.value}
      onSelectionChange={onSelectionChange}
    />
  );
}

export function ReactTableFilterColumn<Data extends RowData>(props: { table: Table<Data> }) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-bold">Filter par:</span>
      {props.table.options.columns
        .filter((col) => !!col.meta?.filters)
        .map((col) => {
          switch (col.meta?.filters?.type) {
            case 'enum':
              return (
                <ReactTableFilterEnum
                  table={props.table}
                  filter={col.meta.filters}
                  key={col.meta.filters.filterId}
                />
              );
            case 'asyncList':
              return (
                <ReactTableFilterColumnAsyncList
                  table={props.table}
                  filter={col.meta.filters}
                  key={col.meta.filters.filterId}
                />
              );
            default:
              return null;
          }
        })}
    </div>
  );
}
