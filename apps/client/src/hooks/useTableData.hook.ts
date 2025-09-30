import { useMemo, useState } from 'react';

export interface TableDataConfig<T, F = Record<string, unknown>> {
  data: T[];
  filters: F;
  applyFilters: (data: T[], filters: F) => T[];
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
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
  onSort
}: TableDataConfig<T, F>): TableDataResult<T> {
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<string | undefined>(initialSortField);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection || 'asc');

  // Appliquer les filtres
  const filteredData = useMemo(() => {
    return applyFilters(data, filters);
  }, [data, filters, applyFilters]);

  // Appliquer le tri
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;

    return [...filteredData].sort((a, b) => {
      // Fonction pour extraire la valeur de tri selon le champ
      const getSortValue = (item: T, field: string) => {
        const itemRecord = item as Record<string, unknown>;

        // Mapping des champs vers les propriétés réelles
        switch (field) {
          case 'numero':
            return (itemRecord.content as Record<string, unknown>)?.numeroDeDossier || '';
          case 'magistrat':
            return (itemRecord.content as Record<string, unknown>)?.nomMagistrat || '';
          case 'posteActuel':
            return (itemRecord.content as Record<string, unknown>)?.posteActuel || '';
          case 'gradeActuel':
            return (itemRecord.content as Record<string, unknown>)?.grade || '';
          case 'posteCible':
            return (itemRecord.content as Record<string, unknown>)?.posteCible || '';
          case 'gradeCible': {
            const posteCible = ((itemRecord.content as Record<string, unknown>)?.posteCible as string) || '';
            const gradeCible = posteCible.substring(posteCible.lastIndexOf('-') + 1);
            return gradeCible;
          }
          case 'observants':
            return (itemRecord.content as Record<string, unknown>)?.observants || '';
          case 'rapporteurs':
            return (itemRecord.rapporteurs as string[])?.join(' ') || '';
          default:
            return itemRecord[field] || '';
        }
      };

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
  }, [filteredData, sortField, sortDirection]);

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
