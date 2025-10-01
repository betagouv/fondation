import { useMemo } from 'react';

export interface FilteringConfig<T, F = Record<string, unknown>> {
  filters?: F;
  applyFilters?: (data: T[], filters: F) => T[];
}

export interface FilteringResult<T> {
  filteredData: T[];
}

export function useFiltering<T, F = Record<string, unknown>>(
  data: T[],
  config: FilteringConfig<T, F> = {}
): FilteringResult<T> {
  const { filters, applyFilters } = config;

  // Appliquer les filtres (optionnel)
  const filteredData = useMemo(() => {
    if (applyFilters && filters) {
      return applyFilters(data, filters);
    }
    return data;
  }, [data, filters, applyFilters]);

  return {
    filteredData
  };
}
