import { Button } from '@codegouvfr/react-dsfr/Button';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useState, type FC } from 'react';
import type { UserDescriptorSerialized } from 'shared-models';
import { useAffectation, type PrioriteValue } from '../../../../contexts/AffectationDossiersContext';
import { SelectMultipleRapporteurs } from './SelectMultipleRapporteurs';
import { SelectPriorite } from './SelectPriorite';

const actionsGroupeesModal = createModal({
  id: 'actions-groupees-modal',
  isOpenedByDefault: false
});

export type ActionsGroupeesProps = {
  availableRapporteurs: UserDescriptorSerialized[];
};

export const ActionsGroupees: FC<ActionsGroupeesProps> = ({ availableRapporteurs }) => {
  const { selectedDossierIds, updateAffectation, applyPrioriteValue } = useAffectation();
  const [localSelection, setLocalSelection] = useState<string[]>([]);
  const [localPriorite, setLocalPriorite] = useState<PrioriteValue>(undefined);

  const hasSelection = selectedDossierIds.size > 0;

  const handleOpenModal = () => {
    setLocalSelection([]);
    setLocalPriorite(undefined);
    actionsGroupeesModal.open();
  };

  const handleCancel = () => {
    setLocalSelection([]);
    setLocalPriorite(undefined);
    actionsGroupeesModal.close();
  };

  const handleApply = () => {
    Array.from(selectedDossierIds).forEach((dossierId) => {
      if (localSelection.length > 0) {
        updateAffectation(dossierId, localSelection);
      }
      applyPrioriteValue(dossierId, localPriorite);
    });
    setLocalSelection([]);
    setLocalPriorite(undefined);
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
        <div className="flex flex-col gap-2">
          <div>
            <h3 className="mb-2 text-base font-semibold">Définir une priorité</h3>
            <SelectPriorite selectedPriorite={localPriorite} onPrioriteChange={setLocalPriorite} />
          </div>

          <div className="border-t border-gray-200 pt-2">
            <h3 className="mb-2 text-base font-semibold">Affecter des rapporteurs</h3>
            <SelectMultipleRapporteurs
              availableRapporteurs={availableRapporteurs}
              selectedRapporteurs={localSelection}
              onSelectionChange={setLocalSelection}
            />
          </div>
        </div>
      </actionsGroupeesModal.Component>
    </>
  );
};
