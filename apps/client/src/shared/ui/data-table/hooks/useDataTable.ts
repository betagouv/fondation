import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type RowData,
  type Table,
  type TableMeta,
  type TableOptions,
} from '@tanstack/react-table';

type DataTableProps<Data extends RowData> = Omit<
  TableOptions<Data>,
  | 'data'
  | 'getCoreRowModel'
  | 'getSortedRowModel'
  | 'getFilteredRowModel'
  | 'getPaginationRowModel'
  | 'meta'
  | 'enableSorting'
  | 'enableColumnFilters'
  | 'manualSorting'
  | 'manualFiltering'
  | 'manualPagination'
> & {
  data?: Data[] | null;
  enablePagination?: false;
  enableAllRowsSelection?: boolean;
  meta?: Pick<TableMeta<Data>, 'paginationItemLabel' | 'globalFilterPlaceholder'>;

  enableSorting?: false;
  enableColumnFilters?: false;

  manualSorting?: false;
  manualFiltering?: false;
  manualPagination?: false;

  // TODO: enable later, see below
  // enableColumnVisibility?: boolean;
};

/**
 * A more opinionated `useReactTable` more suited for our table use cases.
 * We try to stay close to @tanstack/react-table though.
 *
 * main elements:
 * - provides the default rowModels
 * - enables manual pagination, sorting and filtering by default
 * - allows to disable pagination (enabled by default)
 * - define the table meta
 * - default Array when `data` is nullish
 */
export function useDataTable<Data extends RowData>(props: DataTableProps<Data>): Table<Data> {
  return useReactTable<Data>({
    ...props,

    data: props.data ?? [],

    enableSorting: props.enableSorting !== false,
    enableColumnFilters: props.enableColumnFilters !== false,
    enableRowSelection: props.enableRowSelection,

    manualSorting: props.manualSorting !== false,
    manualFiltering: props.manualFiltering !== false,
    manualPagination: props.manualPagination !== false,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: props.manualSorting !== false ? getSortedRowModel() : undefined,
    getFilteredRowModel: props.manualFiltering !== false ? getFilteredRowModel() : undefined,
    getPaginationRowModel: props.manualPagination !== false ? getPaginationRowModel() : undefined,

    meta: {
      paginationEnabled: props.enablePagination !== false,
      paginationItemLabel: props.meta?.paginationItemLabel,
      allRowsSelectionEnabled: props.enableAllRowsSelection === true,
      globalFilterPlaceholder: props.meta?.globalFilterPlaceholder,

      // TODO: add this feature once the DropdownMenu is able to handle the window collision
      /** @see ReactTableColumnVisibility */
      columnVisibilityEnabled: false, // !!props.enableColumnVisibility,
    },
  });
}
