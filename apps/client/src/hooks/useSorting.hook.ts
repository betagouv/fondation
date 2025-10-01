import { useMemo, useState } from 'react';
import type { Month } from 'shared-models';
import { DateOnly } from '../models/date-only.model';

export interface SortingConfig<T> {
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  getSortValue?: (item: T, field: string) => unknown;
}

export interface SortingResult<T> {
  sortedData: T[];
  sortField: string | undefined;
  sortDirection: 'asc' | 'desc';
  handleSort: (field: string) => void;
  getSortIcon: (field: string) => string;
}

export function useSorting<T>(data: T[], config: SortingConfig<T> = {}): SortingResult<T> {
  const [sortField, setSortField] = useState<string | undefined>(config.sortField);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(config.sortDirection || 'asc');

  const getSortValue = (item: T, field: string): unknown => {
    // Si une fonction personnalisée est fournie, l'utiliser
    if (config.getSortValue) {
      return config.getSortValue(item, field);
    }

    // Sinon, utiliser la logique générique pour naviguer dans les objets nested
    const itemRecord = item as Record<string, unknown>;

    // Support pour les chemins nested (ex: "content.nomMagistrat")
    if (field.includes('.')) {
      return field.split('.').reduce((obj: Record<string, unknown>, key: string) => {
        return (obj as Record<string, unknown>)?.[key] as Record<string, unknown>;
      }, itemRecord);
    }

    // Support pour les tableaux (ex: "rapporteurs" qui est un string[])
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

    if (itemRecord[field] instanceof DateOnly) {
      return itemRecord[field].toFormattedString();
    }

    // Support pour les propriétés directes
    return itemRecord[field] || '';
  };

  // Appliquer le tri
  const sortedData = useMemo(() => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
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
  }, [data, sortField, sortDirection, config.getSortValue]);

  // Gestion du tri
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return 'fr-icon-arrow-down-line';
    return sortDirection === 'asc' ? 'fr-icon-arrow-up-line' : 'fr-icon-arrow-down-line';
  };

  return {
    sortedData,
    sortField,
    sortDirection,
    handleSort,
    getSortIcon
  };
}
