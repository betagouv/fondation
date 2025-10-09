import { DropdownFilter, type FilterOption } from '../../../shared/DropdownFilter';

export interface ReportFiltersState {
  statuts: string[];
}

interface FiltresRapportsProps {
  filters: ReportFiltersState;
  onFiltersChange: (filters: ReportFiltersState) => void;
}

// Options de statut (correspond aux états possibles d'un rapport)
const STATUT_OPTIONS: FilterOption[] = [
  { value: 'Nouveau', label: 'Nouveau' },
  { value: 'En cours', label: 'En cours' },
  { value: 'Prêt à soutenir', label: 'Prêt à soutenir' },
  { value: 'Soutenu', label: 'Soutenu' }
];

export const FiltresRapports = ({ filters, onFiltersChange }: FiltresRapportsProps) => {
  const handleFilterChange = (filterType: keyof ReportFiltersState, values: string[]) => {
    onFiltersChange({
      ...filters,
      [filterType]: values
    });
  };

  return (
    <div id="filtre-rapports" className="flex items-center gap-4">
      <span className="font-bold">Filtrer par :</span>
      <DropdownFilter
        tagName="Statut"
        options={STATUT_OPTIONS}
        selectedValues={filters.statuts}
        onSelectionChange={(values) => handleFilterChange('statuts', values)}
      />
    </div>
  );
};
