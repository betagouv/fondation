import type { DossierDeNominationEtAffectationSnapshot } from 'shared-models/models/session/dossier-de-nomination';
import { DropdownFilter } from '../../../shared/DropdownFilter';
import type { FiltersState } from '../../../shared/filter-configurations';

interface FiltresDossiersDeNominationProps {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
  dataSupply?: DossierDeNominationEtAffectationSnapshot[] | null;
}

export const FiltresDossiersDeNomination = ({
  filters,
  onFiltersChange,
  dataSupply
}: FiltresDossiersDeNominationProps) => {
  const handleFilterChange = (filterType: keyof FiltersState, values: string[]) => {
    onFiltersChange({
      ...filters,
      [filterType]: values
    });
  };

  const rapporteurs = Array.from(new Set(dataSupply?.flatMap((dossier) => dossier.rapporteurs) || []));
  const rapporteursOptions = rapporteurs?.map((rapporteur) => ({
    value: rapporteur,
    label: rapporteur
  }));

  // TODO: Remove this once demo is over
  rapporteursOptions.push({
    value: 'Fake Rapporteur',
    label: 'Fake Rapporteur'
  });

  return (
    <div id="filtre-tableau-affectation-dossier-de-nomination" className="flex items-center gap-4">
      <span className="font-bold">Filtrer par :</span>
      <DropdownFilter
        tagName="Rapporteur"
        options={rapporteursOptions}
        selectedValues={filters.rapporteurs}
        onSelectionChange={(values) => handleFilterChange('rapporteurs', values)}
      />
    </div>
  );
};
