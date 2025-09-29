import { useFilterOptions } from '../../../../hooks/useFilterOptions.hook';
import { DropdownSelect } from '../../../shared/DropdownFilter';
import type { FiltersState } from '../../../shared/filter-configurations';

interface FiltresDossiersDeNominationProps {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
  rapporteurs?: string[] | null;
}

export const FiltresDossiersDeNomination = ({
  filters,
  onFiltersChange,
  rapporteurs
}: FiltresDossiersDeNominationProps) => {
  const filterOptions = useFilterOptions(rapporteurs);

  const handleFilterChange = (filterType: keyof FiltersState, values: string[]) => {
    onFiltersChange({
      ...filters,
      [filterType]: values
    });
  };

  return (
    <div id="filtre-tableau-affectation-dossier-de-nomination" className="flex items-center gap-4">
      <span className="font-bold">Filtrer par :</span>
      <DropdownSelect
        tagName="Rapporteurs"
        options={filterOptions.rapporteurs}
        selectedValues={filters.rapporteurs}
        onSelectionChange={(values) => handleFilterChange('rapporteurs', values)}
      />
    </div>
  );
};
