import { Button } from '@codegouvfr/react-dsfr/Button';
import { useState, type FC } from 'react';
import type { UserDescriptorSerialized } from 'shared-models';
import { useAffectation } from '../../../../contexts/AffectationDossiersContext';
import { DropdownMenu } from '../../../shared/DropdownMenu';
import { DropdownRapporteursBulk } from './DropdownRapporteursBulk';

export type ActionsGroupeesProps = {
  availableRapporteurs: UserDescriptorSerialized[];
};

export const ActionsGroupees: FC<ActionsGroupeesProps> = ({ availableRapporteurs }) => {
  const { selectedDossierIds } = useAffectation();
  const [isOpen, setIsOpen] = useState(false);

  const hasSelection = selectedDossierIds.size > 0;

  return (
    <DropdownMenu
      trigger={
        <Button
          priority="secondary"
          iconId="fr-icon-menu-fill"
          disabled={!hasSelection}
          title={hasSelection ? 'Actions groupées' : 'Sélectionnez des dossiers'}
        >
          Actions groupées
        </Button>
      }
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      disabled={!hasSelection}
    >
      <div className="overflow-hidden rounded border border-gray-300 bg-white shadow-lg">
        <DropdownRapporteursBulk availableRapporteurs={availableRapporteurs} />
      </div>
    </DropdownMenu>
  );
};
