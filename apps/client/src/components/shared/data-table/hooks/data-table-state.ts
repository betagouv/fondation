/* oxlint-disable @typescript-eslint/no-explicit-any */

import type { ITEMS_PAR_PAGE } from '@/types/table.types';
import type { TableState } from '@tanstack/react-table';

/** @see {@link import('@tanstack/react-table').ColumnFiltersState} */
type DataTableFiltering<FilterId extends string, Value> = { id: FilterId; value: Value }[];

/** @see {@link import('@tanstack/react-table').SortingState} */
type DataTableSorting<ColumnId extends string> = { id: ColumnId; desc: boolean }[];

/** @see {@link import('@tanstack/react-table').PaginationState} */
type DataTablePagination = { pageIndex: number; pageSize: (typeof ITEMS_PAR_PAGE)[number]['value'] };

export interface DataTableState<
  GlobalFilterValue = unknown,
  ColumnId extends string = string,
  FilterId extends string = string,
  FilterValue = any
> extends TableState {
  /** @override */ pagination: DataTablePagination;
  /** @override */ sorting: DataTableSorting<ColumnId>;
  /** @override */ columnFilters: DataTableFiltering<FilterId, FilterValue>;
  /** @override */ globalFilter: GlobalFilterValue;
}
