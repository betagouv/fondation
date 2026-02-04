import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch';
import { useReportListFocus } from './useReportListFocus';

export function ReportListViewToggle() {
  const [focus, setFocus] = useReportListFocus();
  const isGeneral = focus === 'general';

  return (
    <ToggleSwitch
      label={isGeneral ? 'Tous les dossiers' : 'Mes dossiers'}
      checked={isGeneral}
      onChange={(checked) => {
        setFocus(checked ? 'general' : 'affectations');
      }}
      showCheckedHint={false}
      labelPosition="right"
      className="nowrap"
      classes={{
        label: 'flex-nowrap flex-grow whitespace-nowrap before:!mr-3'
      }}
    />
  );
}
