import type { FC } from 'react';
import type { UserDescriptorSerialized } from 'shared-models';
import { useAffectation } from '../../../../contexts/AffectationDossiersContext';
import { RapporteursDropdownBase } from './RapporteursDropdownBase';

export type InputAffectationProps = {
  dossierId: string;
  initialRapporteurs: string[];
  availableRapporteurs: UserDescriptorSerialized[];
};

export const DropdownRapporteurs: FC<InputAffectationProps> = ({
  dossierId,
  initialRapporteurs,
  availableRapporteurs
}) => {
  const { affectations, updateAffectation } = useAffectation();
  const selectedRapporteurs = affectations[dossierId] ?? initialRapporteurs;

  const handleSelectionChange = (rapporteurIds: string[]) => {
    updateAffectation(dossierId, rapporteurIds);
  };

  const buttonLabel =
    selectedRapporteurs.length > 0 ? `${selectedRapporteurs.length} sélectionné(s)` : 'Sélectionner';

  return (
    <RapporteursDropdownBase
      availableRapporteurs={availableRapporteurs}
      selectedRapporteurs={selectedRapporteurs}
      onSelectionChange={handleSelectionChange}
      buttonLabel={buttonLabel}
    />
  );
};
