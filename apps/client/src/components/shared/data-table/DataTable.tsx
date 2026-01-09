import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type RowData,
  type SortingState,
  type TableState,
  type VisibilityState,
  type Updater,
  type GlobalFilterTableState,
  type RowSelectionOptions,
  type CoreOptions,
  type RowSelectionState
} from '@tanstack/react-table';
import type { PropsWithChildren } from 'react';

import { ReactTableContent } from './ReactTableContent';
import { ReactTablePagination } from './ReactTablePagination';
import { ReactTableFilterColumn } from './ReactTableFilterColumn';
import { ReactTableFilterSearch } from './ReactTableFilterSearch';
import clsx from 'clsx';

type TableProps<Data extends RowData> = {
  data: Data[];
  columns: ColumnDef<Data, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any

  enableSorting?: false;
  enablePagination?: false;
  enableColumnFilters?: false;
  enableGlobalFilter?: boolean;
  enableAllRowSelection?: false;
  enableRowSelection?: RowSelectionOptions<Data>['enableRowSelection'];
  getRowId?: CoreOptions<Data>['getRowId'];

  manualSorting?: false;
  manualPagination?: false;
  manualFiltering?: false;

  rowCount?: number;

  caption?: () => React.ReactNode;
  classNames?: { content?: string; filters?: string; pagination?: string };

  meta?: { paginationItemLabel?: { one: string; other: string } | string };
  onStateChange?: (updater: Updater<TableState>) => void;
  state?: {
    columnFilters?: ColumnFiltersState;
    columnVisibility?: VisibilityState;
    globalFilter?: GlobalFilterTableState;
    pagination?: PaginationState;
    rowSelection?: RowSelectionState;
    sorting?: SortingState;
  };
};

export function DataTable<Data extends RowData>(props: PropsWithChildren<TableProps<Data>>) {
  const table = useReactTable({
    data: props.data,
    columns: props.columns,

    enableGlobalFilter: props.enableGlobalFilter,
    enableSorting: props.enableSorting !== false,
    enableColumnFilters: props.enableColumnFilters !== false,
    enableRowSelection: props.enableRowSelection === true,
    getRowId: props.getRowId,

    manualSorting: props.manualSorting !== false,
    manualFiltering: props.manualFiltering !== false,
    manualPagination: props.manualPagination !== false,
    meta: {
      columnSelection: {
        allRowSelectionEnabled: props.enableAllRowSelection !== false
      },
      pagination: {
        itemLabel: props.meta?.paginationItemLabel,
        enabled: props.enablePagination
      }
    },
    rowCount: props.rowCount,
    onStateChange: props.onStateChange,
    state: {
      columnFilters: props.state?.columnFilters,
      columnVisibility: props.state?.columnVisibility,
      globalFilter: props.state?.globalFilter,
      pagination: props.state?.pagination,
      rowSelection: props.state?.rowSelection,
      sorting: props.state?.sorting
    },

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div>
      {table.options.enableColumnFilters || table.options.enableGlobalFilter || props.children ? (
        <header className="flex items-center justify-between">
          {table.options.enableColumnFilters || table.options.enableGlobalFilter ? (
            <div
              className={`table-filters flex items-center gap-4 ${props.classNames?.filters ?? 'fr-container'}`}
            >
              <ReactTableFilterSearch table={table} />
              <ReactTableFilterColumn table={table} />
            </div>
          ) : null}

          {props.children ? (
            <div className={clsx('table-filter-end', { 'self-justify-end': !table.options.enableFilters })}>
              {props.children}
            </div>
          ) : null}
        </header>
      ) : null}

      <div className={`table-content ${props.classNames?.content ?? ''}`}>
        <ReactTableContent table={table}>{props.caption?.()}</ReactTableContent>
      </div>

      {table.options.meta?.pagination?.enabled !== false ? (
        <div className={`table-pagination ${props.classNames?.pagination ?? 'fr-container'}`}>
          <ReactTablePagination table={table} />
        </div>
      ) : null}
    </div>
  );
}
