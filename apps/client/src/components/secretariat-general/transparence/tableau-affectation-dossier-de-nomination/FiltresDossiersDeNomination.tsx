import type { DossierDeNominationEtAffectationSnapshot } from 'shared-models/models/session/dossier-de-nomination';
import { DropdownFilter } from '../../../shared/DropdownFilter';
import type { FiltersState } from '../../../shared/filter-configurations';
import { useFilterOptions } from '../../../../hooks/useFilterOptions.hook';

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
  const filterOptions = useFilterOptions(dataSupply);

  const handleFilterChange = (filterType: keyof FiltersState, values: string[]) => {
    onFiltersChange({
      ...filters,
      [filterType]: values
    });
  };

  return (
    <div id="filtre-tableau-affectation-dossier-de-nomination" className="flex items-center gap-4">
      <span className="font-bold">Filtrer par :</span>
      <DropdownFilter
        tagName="Rapporteurs"
        options={filterOptions.rapporteurs}
        selectedValues={filters.rapporteurs}
        onSelectionChange={(values) => handleFilterChange('rapporteurs', values)}
      />
    </div>
  );
};
