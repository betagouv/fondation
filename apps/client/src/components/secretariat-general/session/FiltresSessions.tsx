import { DropdownFilter } from '../../shared/DropdownFilter';
import { FORMATION_OPTIONS, SAISINE_OPTIONS } from '../../shared/filter-configurations';

export interface SessionFiltersState {
  formations: string[];
  typeDeSaisine: string[];
}

interface FiltresSessionsProps {
  filters: SessionFiltersState;
  onFiltersChange: (filters: SessionFiltersState) => void;
}

export const FiltresSessions = ({ filters, onFiltersChange }: FiltresSessionsProps) => {
  const handleFilterChange = (filterType: keyof SessionFiltersState, values: string[]) => {
    onFiltersChange({
      ...filters,
      [filterType]: values
    });
  };

  return (
    <div id="filtre-sessions" className="flex items-center gap-4 mb-4">
      <span className="font-bold">Filtrer par :</span>
      <DropdownFilter
        tagName="Formation"
        options={FORMATION_OPTIONS}
        selectedValues={filters.formations}
        onSelectionChange={(values) => handleFilterChange('formations', values)}
      />
      <DropdownFilter
        tagName="Type de saisine"
        options={SAISINE_OPTIONS}
        selectedValues={filters.typeDeSaisine}
        onSelectionChange={(values) => handleFilterChange('typeDeSaisine', values)}
      />
    </div>
  );
};
