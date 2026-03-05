import { PrioriteEnumLabels } from '@/types/enums.types';
import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';
import { useNominationFilesTable } from '../../contexts/files-table.context';
import { NominationFilesPrioritySelectorCell } from './NominationFilesPrioritySelectorCell';

const NominationFilesPriorityReadOnly = ({ file: { priorities } }: { file: SessionNominationFile }) =>
  priorities.length > 0 ? priorities.map((p) => PrioriteEnumLabels[p]).join(', ') : '-';

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
    return <NominationFilesPrioritySelectorCell fileId={props.nominationFile.id} />;
  }

  return <NominationFilesPriorityReadOnly file={props.nominationFile} />;
}
