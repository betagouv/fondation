import { DropdownFilter } from '../../../shared/DropdownFilter';
import type { FiltersState } from '../../../shared/filter-configurations';
import { useFilterOptions, type RapporteurOption } from '../../../../hooks/useFilterOptions.hook';

interface FiltresDossiersDeNominationProps {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
  rapporteurs?: RapporteurOption[] | null;
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
      <DropdownFilter
        tagName="Rapporteur(s)"
        options={filterOptions.rapporteurs}
        selectedValues={filters.rapporteurs}
        onSelectionChange={(values) => handleFilterChange('rapporteurs', values)}
      />
      <DropdownFilter
        tagName="Priorité"
        options={filterOptions.priorite}
        selectedValues={filters.priorite}
        onSelectionChange={(values) => handleFilterChange('priorite', values)}
      />
    </div>
  );
};
