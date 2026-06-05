import { useNominationFilesTable } from '../contexts/files-table.context';

import { AgendaBasketButton } from './AgendaBasketButton';
import { NominationFilesAutoAffectationButton } from './NominationFilesAutoAffectationButton';
import { NominationFilesBatchOperationsButton } from './NominationFilesBatchOperationsButton';
import { NominationFilesSaveAffectationsButton } from './NominationFilesSaveAffectationsButton';
import { NominationFilesToggleEditionModeButton } from './NominationFilesToggleEditionModeButton';

export function NominationFilesTableActionsBar() {
  const { isEditable, edition } = useNominationFilesTable();

  if (!isEditable) return null;

  return (
    <div className="flex items-center gap-2">
      {edition?.isEditing ? (
        <>
          <NominationFilesAutoAffectationButton />
          <NominationFilesBatchOperationsButton />
          <NominationFilesSaveAffectationsButton />
          <AgendaBasketButton />
        </>
      ) : null}

      <NominationFilesToggleEditionModeButton />
    </div>
  );
}
