import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch';
import { useQueryState } from 'nuqs';
import { FormattedMessage } from 'react-intl';

import { useMyFilesFilter } from '@/features/reports/hooks/useMyFilesFilter';
import { SIDE_PANEL_DOSSIER_PARAM } from '@/utils/route-path.utils';
import { useUser } from '@queries/auth.queries';

export function ReportListViewToggle() {
  const { user } = useUser();
  const [isMine, setIsMine] = useMyFilesFilter(user?.id);
  const [, setOpenedDossier] = useQueryState(SIDE_PANEL_DOSSIER_PARAM);

  return (
    <ToggleSwitch
      checked={isMine}
      className="nowrap"
      classes={{ label: 'flex-nowrap grow whitespace-nowrap before:mr-3!' }}
      label={<FormattedMessage defaultMessage="Afficher uniquement mes dossiers" />}
      labelPosition="right"
      onChange={(checked) => {
        setIsMine(checked);
        setOpenedDossier(null);
      }}
      showCheckedHint={false}
    />
  );
}
