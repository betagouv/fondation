import type { RowData, Table } from '@tanstack/react-table';
import React from 'react';
import { useIntl } from 'react-intl';

import { DropdownFilter } from '../DropdownFilter';
import type { TableMetaFilterEnum } from '@/tanstack-react-table';

import { useDataTablePaginationItemLabel } from './hooks/useDataTablePaginationItemLabel';
import { ReactTableFilterColumnAsyncList } from './ReactTableFilterColumnAsyncList';

function ReactTableFilterEnum<Data extends RowData>(props: {
  table: Table<Data>;
  filter: TableMetaFilterEnum;
}) {
  const currentFilter = (props.table
    .getState()
    .columnFilters.find(({ id }) => id === props.filter.filterId) ?? {
    id: props.filter.filterId,
    value: [],
  }) as { id: string; value: string[] };

  const options = (
    props.filter.emptyValue ? [props.filter.emptyValue].concat(props.filter.values) : props.filter.values
  ).map(({ id: value, label }) => ({
    value,
    label,
  }));

  const onSelectionChange = React.useCallback(
    (selection: string[]) => {
      props.table.setColumnFilters((filters) =>
        props.filter.multiple !== false
          ? filters
              .filter((filter) => filter.id !== props.filter.filterId)
              .concat({ id: props.filter.filterId, value: selection })
          : [{ id: props.filter.filterId, value: selection }],
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

export function ReactTableFilterColumn<Data extends RowData>(props: { table: Table<Data> }) {
  const intl = useIntl();
  const hasFilterActive =
    props.table
      .getState()
      .columnFilters.some(
        ({ value }) =>
          (Array.isArray(value) && value.length > 0) ||
          (typeof value === 'string' && value.trim().length > 0),
      ) || props.table.getState().globalFilter?.trim();

  const rowsCount = props.table.getRowCount();
  const itemLabel = useDataTablePaginationItemLabel(props.table);
  const label =
    hasFilterActive && itemLabel
      ? `${rowsCount} ${itemLabel}`
      : intl.formatMessage({ defaultMessage: `Filtrer par` });

  return (
    <div className="flex items-center gap-4">
      <span>{label}</span>
      {props.table.options.columns
        .filter((col) => !!col.meta?.filters)
        .map((col) => {
          switch (col.meta?.filters?.type) {
            case 'enum':
              return (
                <ReactTableFilterEnum
                  filter={col.meta.filters}
                  key={col.meta.filters.filterId}
                  table={props.table}
                />
              );
            case 'asyncList':
              return (
                <ReactTableFilterColumnAsyncList
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
