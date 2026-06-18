import { useNominationFilesTable } from '../../../context/files-table.context';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { NominationFileDocStatusBadge } from './NominationFileDocStatusBadge';
import { NominationFileOutcome } from './NominationFileOutcome';
import { NominationFileOutcomeSelector } from './NominationFileOutcomeSelector';

export function NominationFilesOutcomeCell(props: { nominationFile: SessionNominationFile }) {
  const { edition } = useNominationFilesTable();

  if (edition?.isEditing && props.nominationFile.content.isUpdatable) {
    return <NominationFileOutcomeSelector nominationFile={props.nominationFile} />;
  }

  return (
    <div className="flex flex-col gap-y-1">
      <NominationFileDocStatusBadge status={props.nominationFile.content.status} />
      <NominationFileOutcome nominationFile={props.nominationFile} />
    </div>
  );
}
