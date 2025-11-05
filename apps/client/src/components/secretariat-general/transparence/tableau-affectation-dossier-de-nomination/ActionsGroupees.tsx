import { Button } from '@codegouvfr/react-dsfr/Button';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useState, type FC } from 'react';
import type { UserDescriptorSerialized } from 'shared-models';
import { useAffectation } from '../../../../contexts/AffectationDossiersContext';
import { SelectMultipleRapporteurs } from './SelectMultipleRapporteurs';

const actionsGroupeesModal = createModal({
  id: 'actions-groupees-modal',
  isOpenedByDefault: false
});

export type ActionsGroupeesProps = {
  availableRapporteurs: UserDescriptorSerialized[];
};

export const ActionsGroupees: FC<ActionsGroupeesProps> = ({ availableRapporteurs }) => {
  const { selectedDossierIds, updateAffectation } = useAffectation();
  const [localSelection, setLocalSelection] = useState<string[]>([]);

  const hasSelection = selectedDossierIds.size > 0;

  const handleOpenModal = () => {
    setLocalSelection([]);
    actionsGroupeesModal.open();
  };

  const handleCancel = () => {
    setLocalSelection([]);
    actionsGroupeesModal.close();
  };

  const handleApply = () => {
    // Appliquer l'affectation à tous les dossiers sélectionnés
    Array.from(selectedDossierIds).forEach((dossierId) => {
      updateAffectation(dossierId, localSelection);
    });
    setLocalSelection([]);
    actionsGroupeesModal.close();
  };

  return (
    <>
      <Button
        priority="secondary"
        iconId="fr-icon-menu-fill"
        disabled={!hasSelection}
        onClick={handleOpenModal}
      >
        Actions groupées
      </Button>

      <actionsGroupeesModal.Component
        title="Actions groupées"
        buttons={[
          {
            children: 'Annuler',
            priority: 'secondary',
            onClick: handleCancel
          },
          {
            children: 'Appliquer',
            onClick: handleApply
          }
        ]}
      >
        <SelectMultipleRapporteurs
          availableRapporteurs={availableRapporteurs}
          selectedRapporteurs={localSelection}
          onSelectionChange={setLocalSelection}
        />
      </actionsGroupeesModal.Component>
    </>
  );
};
