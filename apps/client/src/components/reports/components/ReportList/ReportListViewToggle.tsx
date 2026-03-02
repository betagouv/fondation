import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch';
import { useReportListFocus } from './useReportListFocus';

export function ReportListViewToggle(props: { onChange?: (focus: 'general' | 'affectations') => unknown }) {
  const [focus, setFocus] = useReportListFocus();
  const isGeneral = focus === 'general';

  return (
    <ToggleSwitch
      label={isGeneral ? 'Tous les dossiers' : 'Mes dossiers'}
      checked={isGeneral}
      onChange={(checked) => {
        const next = checked ? 'general' : 'affectations';
        setFocus(next);
        props.onChange?.(next);
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
