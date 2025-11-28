import { useMemo } from 'react';
import type { FilterOption } from '../components/shared/DropdownFilter';
import {
  FILTER_RAPPORTEUR_NOBODY,
  FORMATION_OPTIONS,
  PRIORITE_OPTIONS,
  SAISINE_OPTIONS
} from '../components/shared/filter-configurations';

interface FilterOptions {
  rapporteurs: FilterOption[];
  formations: FilterOption[];
  sessionType: FilterOption[];
  priorite: FilterOption[];
}

export const useFilterOptions = (rapporteurs: string[] | null | undefined): FilterOptions => {
  return useMemo(() => {
    const uniqueRapporteurs: { value: string; label: string }[] = [];
    for (const value of new Set(rapporteurs)) {
      if (!value) continue;

      const [firstName, lastName] = value.split(' ');
      uniqueRapporteurs.push({
        value,
        label: firstName.toUpperCase() + ' ' + lastName.charAt(0).toUpperCase() + lastName.slice(1)
      });
    }

    uniqueRapporteurs.sort((a, b) => a.value.localeCompare(b.value));

    return {
      rapporteurs: [FILTER_RAPPORTEUR_NOBODY].concat(uniqueRapporteurs),
      formations: FORMATION_OPTIONS,
      sessionType: SAISINE_OPTIONS,
      priorite: PRIORITE_OPTIONS
    };
  }, [rapporteurs]);
};
