import { useMemo } from 'react';
import type { DossierDeNominationEtAffectationSnapshot } from 'shared-models/models/session/dossier-de-nomination';
import type { FilterOption } from '../components/shared/DropdownFilter';
import { formationFilterOptions, sessionTypeFilterOptions } from '../components/shared/filter-configurations';

interface FilterOptions {
  rapporteurs: FilterOption[];
  formations: FilterOption[];
  sessionType: FilterOption[];
}

export const useFilterOptions = (
  data: DossierDeNominationEtAffectationSnapshot[] | null | undefined
): FilterOptions => {
  return useMemo(() => {
    if (!data || data.length === 0) {
      return {
        rapporteurs: [],
        formations: formationFilterOptions,
        sessionType: sessionTypeFilterOptions
      };
    }

    // Extraire les rapporteurs uniques
    const uniqueRapporteurs = Array.from(new Set(data.flatMap((dossier) => dossier.rapporteurs)));

    return {
      rapporteurs: uniqueRapporteurs.map((rapporteur) => ({
        value: rapporteur,
        label: rapporteur.toLocaleUpperCase()
      })),
      formations: formationFilterOptions,
      sessionType: sessionTypeFilterOptions
    };
  }, [data]);
};
