import { useNominationFilesTable } from '../../context/files-table.context';
import { PriorityBadgeList } from '@/components/shared/priorities/PriorityBadge';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { NominationFilesPrioritySelectorCell } from './NominationFilesPrioritySelectorCell';

const NominationFilesPriorityReadOnly = ({ file: { priorities } }: { file: SessionNominationFile }) => (
  <PriorityBadgeList priorities={priorities} />
);

export function NominationFilesPriorityCell(props: { nominationFile: SessionNominationFile }) {
  const { edition } = useNominationFilesTable();
  const isUpdatable = !!props.nominationFile.content.isUpdatable;

  if (edition?.isEditing && isUpdatable) {
    return <NominationFilesPrioritySelectorCell fileId={props.nominationFile.id} />;
  }

  return <NominationFilesPriorityReadOnly file={props.nominationFile} />;
}
