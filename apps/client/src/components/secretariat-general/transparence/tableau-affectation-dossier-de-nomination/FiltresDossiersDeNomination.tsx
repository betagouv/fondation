import { DropdownFilter } from '../../../shared/DropdownFilter';
import { filterConfigurations } from '../../../shared/filter-configurations';
import type { FiltersState } from '../../../shared/filter-configurations';

interface FiltresDossiersDeNominationProps {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
}

export const FiltresDossiersDeNomination = ({
  filters,
  onFiltersChange
}: FiltresDossiersDeNominationProps) => {
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
        {...filterConfigurations.formation}
        selectedValues={filters.formations}
        onSelectionChange={(values) => handleFilterChange('formations', values)}
      />
    </div>
  );
};
