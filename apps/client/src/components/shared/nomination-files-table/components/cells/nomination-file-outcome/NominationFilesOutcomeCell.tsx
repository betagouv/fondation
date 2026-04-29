import type { SessionNominationFile } from '@queries/nomination-sessions.queries';
import { useNominationFilesTable } from '../../../contexts/files-table.context';
import { NominationFileDocStatusBadge } from './NominationFileDocStatusBadge';
import { NominationFileOutcome } from './NominationFileOutcome';
import { NominationFileOutcomeSelector } from './NominationFileOutcomeSelector';

export function NominationFilesOutcomeCell(props: { nominationFile: SessionNominationFile }) {
  const { edition } = useNominationFilesTable();

  if (!props.nominationFile.content.isUpdatable) {
    return (
      <div className="flex flex-col gap-y-1">
        <NominationFileDocStatusBadge
          status={props.nominationFile.content.status}
          docs={props.nominationFile.content.docs}
        />
        <NominationFileOutcome nominationFile={props.nominationFile} />
      </div>
    );
  }

  if (edition?.isEditing && props.nominationFile.content.isUpdatable) {
    return <NominationFileOutcomeSelector nominationFile={props.nominationFile} />;
  }

  return <NominationFileOutcome nominationFile={props.nominationFile} />;
}
