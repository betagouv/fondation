import { useMemo, useState } from 'react';

export type ItemsPerPage = 5 | 10 | 15 | 25 | 50;

export interface PaginationConfig {
  itemsPerPage?: ItemsPerPage;
}

export interface PaginationResult<T> {
  paginatedData: T[];
  totalItems: number;
  displayedItems: number;
  itemsPerPage: ItemsPerPage;
  setItemsPerPage: (value: ItemsPerPage) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
}

export function usePagination<T>(data: T[], config: PaginationConfig = {}): PaginationResult<T> {
  const [itemsPerPage, setItemsPerPage] = useState<ItemsPerPage>(config.itemsPerPage ?? 50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(data.length / itemsPerPage);

  // Calculer les données paginées
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  // Réinitialiser la page courante si elle dépasse le nombre total de pages
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  return {
    paginatedData,
    totalItems: data.length,
    displayedItems: paginatedData.length,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages
  };
}
