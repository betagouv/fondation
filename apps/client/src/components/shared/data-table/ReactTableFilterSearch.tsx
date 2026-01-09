import SearchBar from '@codegouvfr/react-dsfr/SearchBar';
import type { RowData, Table } from '@tanstack/react-table';
import React from 'react';
import { useDebouncedCallback } from 'use-debounce';

export function ReactTableFilterSearch<Data extends RowData>(props: { table: Table<Data> }) {
  const [search, setSearch] = React.useState(props.table.getState().globalFilter);
  const updateGlobalFilter = useDebouncedCallback((globalFilter: string) => {
    props.table.setGlobalFilter(globalFilter);
  }, 600);

  if (!props.table.options.enableGlobalFilter) return null;

  return (
    <div style={{ width: '20%' }}>
      <SearchBar
        renderInput={(inputProps) => (
          <input
            {...inputProps}
            value={search}
            onChange={(e) => {
              const value = String(e.target.value);
              setSearch(value);
              updateGlobalFilter(value);
            }}
          />
        )}
      />
    </div>
  );
}
