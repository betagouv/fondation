import { useMemo } from 'react';
import type { FilterOption } from '../components/shared/DropdownFilter';
import { formationFilterOptions, sessionTypeFilterOptions } from '../components/shared/filter-configurations';

interface FilterOptions {
  rapporteurs: FilterOption[];
  formations: FilterOption[];
  sessionType: FilterOption[];
}

export const useFilterOptions = (rapporteurs: string[] | null | undefined): FilterOptions => {
  return useMemo(() => {
    if (!rapporteurs || rapporteurs.length === 0) {
      return {
        rapporteurs: [],
        formations: formationFilterOptions,
        sessionType: sessionTypeFilterOptions
      };
    }

    // Extraire les rapporteurs uniques
    const uniqueRapporteurs = Array.from(new Set(rapporteurs));

    return {
      rapporteurs: uniqueRapporteurs.map((rapporteur) => ({
        value: rapporteur,
        label: rapporteur.toLocaleUpperCase()
      })),
      formations: formationFilterOptions,
      sessionType: sessionTypeFilterOptions
    };
  }, [rapporteurs]);
};
