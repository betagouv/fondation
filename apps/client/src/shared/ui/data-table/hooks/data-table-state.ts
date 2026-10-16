/* oxlint-disable @typescript-eslint/no-explicit-any */

import type { TableState } from '@tanstack/react-table';

/** @see {@link import('@tanstack/react-table').ColumnFiltersState} */
type DataTableFiltering<FilterId extends string, Value> = { id: FilterId; value: Value }[];

/** @see {@link import('@tanstack/react-table').SortingState} */
type DataTableSorting<ColumnId extends string> = { id: ColumnId; desc: boolean }[];

export interface DataTableState<
  GlobalFilterValue = unknown,
  ColumnId extends string = string,
  FilterId extends string = string,
  FilterValue = any,
> extends TableState {
  /** @override */ columnFilters: DataTableFiltering<FilterId, FilterValue>;
  /** @override */ globalFilter: GlobalFilterValue;
  /** @override */ sorting: DataTableSorting<ColumnId>;
}
