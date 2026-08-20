import Button from '@codegouvfr/react-dsfr/Button';
import { FormattedMessage } from 'react-intl';

import { useNominationFilesTable } from '../context/files-table.context';

export function NominationFilesExportButton(props: { disabled: boolean; onExport: () => void }) {
  const { canManage } = useNominationFilesTable();

  if (!canManage) return null;

  return (
    <Button
      className="py-2!"
      disabled={props.disabled}
      iconId="fr-icon-download-line"
      iconPosition="right"
      onClick={props.onExport}
      priority="tertiary"
      size="small"
    >
      <FormattedMessage defaultMessage="Export .xlsx" />
    </Button>
  );
}
