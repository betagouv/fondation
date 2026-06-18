import Button from '@codegouvfr/react-dsfr/Button';
import React from 'react';

import { useAffectations } from '../context/files-affectations.context';
import { useNominationFilesTable } from '../context/files-table.context';

export function NominationFilesToggleEditionModeButton() {
  const { isEditable, edition } = useNominationFilesTable();
  const { hasChanges, resetAffectations } = useAffectations();

  const onClick = React.useCallback(() => {
    if (!isEditable) return;

    resetAffectations();
    edition?.setEditing((editing) => !editing);
  }, [isEditable, edition, resetAffectations]);

  if (!isEditable) return null;

  if (!edition?.isEditing) {
    return (
      <Button
        size="small"
        priority="secondary"
        iconId="fr-icon-edit-fill"
        title="Éditer les dossiers"
        onClick={onClick}
      />
    );
  }

  return (
    <Button
      size="small"
      priority="secondary"
      iconId="fr-icon-close-line"
      title={hasChanges ? 'Annuler les modifications' : 'Revenir au mode lecture'}
      onClick={onClick}
    >
      {hasChanges ? 'Annuler' : 'Fermer'}
    </Button>
  );
}
