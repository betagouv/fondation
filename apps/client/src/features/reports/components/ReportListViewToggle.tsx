import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch';
import { useQueryState } from 'nuqs';

import { SIDE_PANEL_DOSSIER_PARAM } from '@/features/nomination-files-table/components/cells/magistrat-side-panel/context/side-panel.context';
import { useMyFilesFilter } from '@/features/reports/hooks/useMyFilesFilter';
import { useUser } from '@queries/auth.queries';

export function ReportListViewToggle() {
  const { user } = useUser();
  const [isMine, setIsMine] = useMyFilesFilter(user?.id);
  const [, setOpenedDossier] = useQueryState(SIDE_PANEL_DOSSIER_PARAM);

  return (
    <ToggleSwitch
      label="Afficher uniquement mes dossiers"
      checked={isMine}
      onChange={(checked) => {
        setIsMine(checked);
        setOpenedDossier(null);
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
