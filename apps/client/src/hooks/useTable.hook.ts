import { useFiltering } from './useFiltering.hook';
import { usePagination } from './usePagination.hook';
import { useSorting } from './useSorting.hook';

export interface TableConfig<T, F = Record<string, unknown>> {
  // Pagination
  itemsPerPage?: number;

  // Sorting
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  getSortValue?: (item: T, field: string) => unknown;

  // Filtering
  filters?: F;
  applyFilters?: (data: T[], filters: F) => T[];
}

export interface TableResult<T> {
  // Data
  data: T[];
  totalItems: number;
  displayedItems: number;

  // Pagination
  itemsPerPage: number;
  setItemsPerPage: (value: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;

  // Sorting
  sortField: string | undefined;
  sortDirection: 'asc' | 'desc';
  handleSort: (field: string) => void;
  getSortIcon: (field: string) => string;
}

export function useTable<T, F = Record<string, unknown>>(
  data: T[],
  config: TableConfig<T, F> = {}
): TableResult<T> {
  const { filteredData } = useFiltering(data, {
    filters: config.filters,
    applyFilters: config.applyFilters
  });

  const { sortedData, sortField, sortDirection, handleSort, getSortIcon } = useSorting<T>(filteredData, {
    sortField: config.sortField,
    sortDirection: config.sortDirection,
    getSortValue: config.getSortValue
  });

  const {
    paginatedData,
    totalItems,
    displayedItems,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages
  } = usePagination<T>(sortedData, {
    itemsPerPage: config.itemsPerPage
  });

  return {
    data: paginatedData,
    totalItems,
    displayedItems,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    sortField,
    sortDirection,
    handleSort,
    getSortIcon
  };
}
