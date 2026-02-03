import type { SessionNominationFile } from '@queries/nomination-sessions.queries';
import { useNominationFilesTable } from '../../contexts/files-table.context';
import { PrioriteEnumLabels } from '@/types/enums.types';
import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import { NominationFilesPrioritySelector } from './NominationFilesPrioritySelector';

function NominationFilesPriorityReadOnly(props: { file: SessionNominationFile }) {
  const value = props.file.priority;
  return value ? PrioriteEnumLabels[value] : '-';
}

export function NominationFilesPriorityCell(props: { nominationFile: SessionNominationFile }) {
  const { edition } = useNominationFilesTable();
  const hasOutcome = !!props.nominationFile.content.outcome;

  if (edition?.isEditing && hasOutcome) {
    return (
      <Tooltip title="issue renseignée">
        <NominationFilesPriorityReadOnly file={props.nominationFile} />
      </Tooltip>
    );
  }

  if (edition?.isEditing) {
    return <NominationFilesPrioritySelector fileId={props.nominationFile.id} />;
  }

  return <NominationFilesPriorityReadOnly file={props.nominationFile} />;
}
