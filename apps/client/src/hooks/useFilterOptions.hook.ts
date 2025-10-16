import { useMemo } from 'react';
import type { FilterOption } from '../components/shared/DropdownFilter';
import {
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
    if (!rapporteurs || rapporteurs.length === 0) {
      return {
        rapporteurs: [],
        formations: FORMATION_OPTIONS,
        sessionType: SAISINE_OPTIONS,
        priorite: PRIORITE_OPTIONS
      };
    }

    const uniqueRapporteurs = Array.from(new Set(rapporteurs)).filter((r): r is string => r != null);

    return {
      rapporteurs: uniqueRapporteurs.map((rapporteur) => ({
        value: rapporteur,
        label: rapporteur.toLocaleUpperCase()
      })),
      formations: FORMATION_OPTIONS,
      sessionType: SAISINE_OPTIONS,
      priorite: PRIORITE_OPTIONS
    };
  }, [rapporteurs]);
};
