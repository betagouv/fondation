import { useMemo, type FC } from 'react';
import type { UserDescriptorSerialized } from 'shared-models';
import { useAffectation } from '../../../../contexts/AffectationDossiersContext';
import { RapporteursDropdownBase } from './RapporteursDropdownBase';
import { AvatarInitials } from '../../../layout/AvatarInitials';
import { getInitials } from '../../../../utils/get-initials';

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

  const avatarsInitials = useMemo(() => {
    return (selectedRapporteurs || [])
      .map((rapporteurId) => {
        const rapporteur = availableRapporteurs.find((r) => r.userId === rapporteurId);
        if (!rapporteur) return null;
        const initials = getInitials(rapporteur.firstName, rapporteur.lastName);
        return <AvatarInitials key={rapporteurId} initials={initials} size="md" />;
      })
      .filter(Boolean);
  }, [selectedRapporteurs, availableRapporteurs]);

  const buttonLabel =
    avatarsInitials.length > 0 ? (
      <div className="flex items-center gap-2">{avatarsInitials}</div>
    ) : (
      'Sélectionner'
    );

  return (
    <RapporteursDropdownBase
      availableRapporteurs={availableRapporteurs}
      selectedRapporteurs={selectedRapporteurs}
      onSelectionChange={handleSelectionChange}
      buttonLabel={buttonLabel}
    />
  );
};
