import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch';
import { useQueryState } from 'nuqs';

import { SIDE_PANEL_DOSSIER_PARAM } from '@/features/nomination-files-table/components/cells/magistrat-side-panel/context/side-panel.context';
import { useReportListFocus } from '@/features/reports/hooks/useReportListFocus';

export function ReportListViewToggle(props: { onChange?: (focus: 'general' | 'affectations') => unknown }) {
  const [focus, setFocus] = useReportListFocus();
  const [, setOpenedDossier] = useQueryState(SIDE_PANEL_DOSSIER_PARAM);
  const isGeneral = focus === 'general';

  return (
    <ToggleSwitch
      label={isGeneral ? 'Tous les dossiers' : 'Mes dossiers'}
      checked={isGeneral}
      onChange={(checked) => {
        const next = checked ? 'general' : 'affectations';
        setFocus(next);
        setOpenedDossier(null);
        props.onChange?.(next);
      }}
      showCheckedHint={false}
      labelPosition="right"
      className="nowrap"
      classes={{
        label: 'flex-nowrap grow whitespace-nowrap before:mr-3!',
      }}
    />
  );
}
