import type { Magistrat } from 'shared-models';
import { DropdownFilter } from '../../shared/DropdownFilter';
import { FORMATION_OPTIONS } from '../../shared/filter-configurations';

export interface SessionFiltersState {
  formations: Magistrat.Formation[];
}

interface FiltresSessionsProps {
  filters: SessionFiltersState;
  onFiltersChange: (filters: SessionFiltersState) => void;
}

export const FiltresSessions = ({ filters, onFiltersChange }: FiltresSessionsProps) => {
  return (
    <div id="filtre-sessions" className="mb-4 flex items-center gap-4">
      <span className="font-bold">Filtrer par :</span>
      <DropdownFilter
        tagName="Formation"
        options={FORMATION_OPTIONS}
        selectedValues={filters.formations}
        onSelectionChange={(values) => onFiltersChange({ formations: values as Magistrat.Formation[] })}
      />
    </div>
  );
};
