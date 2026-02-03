import type { SessionNominationFile } from '@queries/nomination-sessions.queries';
import { useNominationFilesTable } from '../../../contexts/files-table.context';
import { NominationFileOutcomeSelector } from './NominationFileOutcomeSelector';
import { NominationFileOutcome } from './NominationFileOutcome';

export function NominationFilesOutcomeCell(props: { nominationFile: SessionNominationFile }) {
  const { edition } = useNominationFilesTable();

  if (edition?.isEditing) return <NominationFileOutcomeSelector nominationFile={props.nominationFile} />;
  return <NominationFileOutcome nominationFile={props.nominationFile} />;
}
