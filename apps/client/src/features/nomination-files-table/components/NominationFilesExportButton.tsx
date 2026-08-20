import Button from '@codegouvfr/react-dsfr/Button';
import { FormattedMessage } from 'react-intl';

import { useNominationFilesTable } from '../context/files-table.context';
import { useListNominationFilesAsExcelMutation } from '@queries/nomination-sessions.queries';

export function NominationFilesExportButton() {
  const { canManage, sessionId } = useNominationFilesTable();
  const { mutate: exportAsExcel, isPending: isExporting } = useListNominationFilesAsExcelMutation();

  if (!canManage) return null;

  return (
    <Button
      className="py-2!"
      disabled={isExporting}
      iconId="fr-icon-download-line"
      iconPosition="right"
      onClick={() => exportAsExcel({ sessionId })}
      priority="tertiary"
      size="small"
    >
      <FormattedMessage defaultMessage="Export .xlsx" />
    </Button>
  );
}
