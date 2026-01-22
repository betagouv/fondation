import type { TableMetaFilterAsyncList } from '@/tanstack-react-table';
import type { RowData, Table } from '@tanstack/react-table';
import { DropdownFilter } from '../DropdownFilter';
import React from 'react';
import { useQuery } from '@tanstack/react-query';

export function ReactTableFilterColumnAsyncList<Data extends RowData>(props: {
  table: Table<Data>;
  filter: TableMetaFilterAsyncList;
}) {
  const currentFilter = props.table.getState().columnFilters.find(({ id }) => id === props.filter.filterId);

  const { data } = useQuery(props.filter.query);

  const options = React.useMemo(
    () =>
      ([] as { id: string; label: string }[])
        .concat(props.filter.emptyValue ? [props.filter.emptyValue] : [], data ?? [])
        .map(({ id, label }) => ({ value: id, label })),
    [props.filter, data]
  );

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
      options={options}
      tagName={props.filter.label}
      onSelectionChange={onSelectionChange}
      selectedValues={(currentFilter?.value ?? []) as string[]}
    />
  );
}
