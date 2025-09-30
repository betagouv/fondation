import { useMemo, useState } from 'react';
import type { Month } from 'shared-models';
import { DateOnly } from '../models/date-only.model';

export interface TableDataConfig<T, F = Record<string, unknown>> {
  data: T[];
  filters?: F;
  applyFilters?: (data: T[], filters: F) => T[];
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  itemsPerPage?: number;
  getSortValue?: (item: T, field: string) => unknown;
}

export interface TableDataResult<T> {
  data: T[];
  totalItems: number;
  displayedItems: number;
  itemsPerPage: number;
  setItemsPerPage: (value: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  handleSort: (field: string) => void;
  getSortIcon: (field: string) => string;
}

export function useTableData<T, F = Record<string, unknown>>({
  data,
  filters,
  applyFilters,
  sortField: initialSortField,
  sortDirection: initialSortDirection,
  onSort,
  itemsPerPage: initialItemsPerPage,
  getSortValue: customGetSortValue
}: TableDataConfig<T, F>): TableDataResult<T> {
  const [itemsPerPage, setItemsPerPage] = useState<number>(initialItemsPerPage ?? 50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<string | undefined>(initialSortField);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection || 'asc');

  // Appliquer les filtres (optionnel)
  const filteredData = useMemo(() => {
    if (applyFilters && filters) {
      return applyFilters(data, filters);
    }
    return data;
  }, [data, filters, applyFilters]);

  // Appliquer le tri
  const sortedData = useMemo(() => {
    const getSortValue = (item: T, field: string): unknown => {
      // Si une fonction personnalisée est fournie, l'utiliser
      if (customGetSortValue) {
        return customGetSortValue(item, field);
      }

      // Sinon, utiliser la logique générique pour naviguer dans les objets nested
      const itemRecord = item as Record<string, unknown>;

      if (field.includes('.')) {
        return field.split('.').reduce((obj: Record<string, unknown>, key: string) => {
          return (obj as Record<string, unknown>)?.[key] as Record<string, unknown>;
        }, itemRecord);
      }

      if (Array.isArray(itemRecord[field])) {
        return (itemRecord[field] as string[])?.join(' ') || '';
      }

      // Vérifier si c'est un objet DateOnly sérialisé (venant de l'API)
      const fieldValue = itemRecord[field];
      if (
        fieldValue &&
        typeof fieldValue === 'object' &&
        'year' in fieldValue &&
        'month' in fieldValue &&
        'day' in fieldValue
      ) {
        const dateOnly = new DateOnly(
          fieldValue.year as number,
          fieldValue.month as Month,
          fieldValue.day as number
        );
        return dateOnly.toFormattedString();
      }

      // Support pour les propriétés directes
      return itemRecord[field] || '';
    };

    if (!sortField) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = getSortValue(a, sortField);
      const bValue = getSortValue(b, sortField);

      // Gestion des types pour la comparaison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }

      // Fallback pour les autres types
      const aStr = String(aValue);
      const bStr = String(bValue);
      const comparison = aStr.localeCompare(bStr);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortField, sortDirection, customGetSortValue]);

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // Calculer les données paginées
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage]);

  // Réinitialiser la page courante si elle dépasse le nombre total de pages
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Gestion du tri
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Retourner à la première page lors du tri
    onSort?.(field);
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return 'fr-icon-arrow-down-line';
    return sortDirection === 'asc' ? 'fr-icon-arrow-up-line' : 'fr-icon-arrow-down-line';
  };

  return {
    data: paginatedData,
    totalItems: sortedData.length,
    displayedItems: paginatedData.length,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    handleSort,
    getSortIcon
  };
}
