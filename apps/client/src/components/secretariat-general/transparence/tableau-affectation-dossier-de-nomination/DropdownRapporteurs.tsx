import { useCallback, useMemo, type FC } from 'react';

import { UserAvatarList } from '@/components/shared/user-avatar';

import { useAffectation } from '../../../../contexts/AffectationDossiersContext';
import { RapporteursDropdownBase } from './RapporteursDropdownBase';

export type InputAffectationProps = {
  dossierId: string;
  initialRapporteurs: string[];
  availableRapporteurs: { userId: string; firstName: string; lastName: string }[];
};

export const DropdownRapporteurs: FC<InputAffectationProps> = ({
  dossierId,
  initialRapporteurs,
  availableRapporteurs
}) => {
  const { affectations, updateAffectation } = useAffectation();
  const selectedRapporteurs = affectations[dossierId] ?? initialRapporteurs;

  const reporterMap = useMemo(
    () => new Map(availableRapporteurs.map((reporter) => [reporter.userId, reporter] as const)),
    [availableRapporteurs]
  );

  const handleSelectionChange = useCallback(
    (rapporteurIds: string[]) => {
      updateAffectation(dossierId, rapporteurIds);
    },
    [dossierId, updateAffectation]
  );

  const selectedUsers = useMemo(
    () =>
      (selectedRapporteurs.length ?? 0) > 0
        ? selectedRapporteurs
            .map((id) => reporterMap.get(id))
            .filter((x): x is NonNullable<typeof x> => Boolean(x))
        : [],
    [selectedRapporteurs, reporterMap]
  );

  const buttonLabel =
    selectedUsers.length > 0 ? <UserAvatarList users={selectedUsers} max={1} size="sm" /> : 'Sélectionner';

  return (
    <RapporteursDropdownBase
      availableRapporteurs={availableRapporteurs}
      selectedRapporteurs={selectedRapporteurs}
      onSelectionChange={handleSelectionChange}
      buttonLabel={buttonLabel}
    />
  );
};
