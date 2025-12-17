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

export type RapporteurOption = {
  userId: string;
  firstName: string;
  lastName: string;
};

export const useFilterOptions = (rapporteurs: RapporteurOption[] | null | undefined): FilterOptions => {
  return useMemo(() => {
    const seen = new Set<string>();
    const uniqueRapporteurs: FilterOption[] = [];

    for (const r of rapporteurs ?? []) {
      if (seen.has(r.userId)) continue;
      seen.add(r.userId);

      uniqueRapporteurs.push({
        value: r.userId,
        label: `${r.firstName.toUpperCase()} ${r.lastName.charAt(0).toUpperCase()}${r.lastName.slice(1)}`
      });
    }

    uniqueRapporteurs.sort((a, b) => a.label.localeCompare(b.label));

    return {
      rapporteurs: [FILTER_RAPPORTEUR_NOBODY].concat(uniqueRapporteurs),
      formations: FORMATION_OPTIONS,
      sessionType: SAISINE_OPTIONS,
      priorite: PRIORITE_OPTIONS
    };
  }, [rapporteurs]);
};
