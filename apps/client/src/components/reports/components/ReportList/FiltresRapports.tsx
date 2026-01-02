import { NominationFile } from 'shared-models';
import { DropdownFilter, type FilterOption } from '../../../shared/DropdownFilter';

interface FiltresRapportsProps {
  states: NominationFile.ReportState[];
  onStatesChange: (states: NominationFile.ReportState[]) => void;
}

const STATUT_OPTIONS: FilterOption[] = [
  { value: NominationFile.ReportState.NEW, label: 'Nouveau' },
  { value: NominationFile.ReportState.IN_PROGRESS, label: 'En cours' },
  { value: NominationFile.ReportState.READY_TO_SUPPORT, label: 'Prêt à soutenir' },
  { value: NominationFile.ReportState.SUPPORTED, label: 'Soutenu' }
];

export const FiltresRapports = ({ states, onStatesChange }: FiltresRapportsProps) => {
  return (
    <div id="filtre-rapports" className="flex items-center gap-4">
      <span className="font-bold">Filtrer par :</span>
      <DropdownFilter
        tagName="Statut"
        options={STATUT_OPTIONS}
        selectedValues={states}
        onSelectionChange={(values) => onStatesChange(values as NominationFile.ReportState[])}
      />
    </div>
  );
};
