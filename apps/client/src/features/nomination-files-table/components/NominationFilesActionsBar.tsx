import { useNominationFilesTable } from '../context/files-table.context';

import { AgendaBasketButtons } from './AgendaBasketButtons';
import { NominationFilesAutoAffectationButton } from './NominationFilesAutoAffectationButton';
import { NominationFilesBatchOperationsButton } from './NominationFilesBatchOperationsButton';
import { NominationFilesSaveAffectationsButton } from './NominationFilesSaveAffectationsButton';
import { NominationFilesToggleEditionModeButton } from './NominationFilesToggleEditionModeButton';

export function NominationFilesTableActionsBar() {
  const { isEditable, edition } = useNominationFilesTable();

  if (!isEditable) return null;

  return (
    <>
      <div className="flex items-start gap-2">
        {edition?.isEditing && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <NominationFilesAutoAffectationButton />
              <NominationFilesBatchOperationsButton />
              <NominationFilesSaveAffectationsButton />
            </div>
            <div className="flex items-center gap-2">
              <AgendaBasketButtons />
            </div>
          </div>
        )}

        <NominationFilesToggleEditionModeButton />
      </div>
    </>
  );
}
