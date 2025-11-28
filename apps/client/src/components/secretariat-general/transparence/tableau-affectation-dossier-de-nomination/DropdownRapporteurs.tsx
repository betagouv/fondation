import { useCallback, useMemo, type FC } from 'react';
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

  const avatarsInitials = useMemo(() => {
    const avatars =
      (selectedRapporteurs.length ?? 0) > 0
        ? selectedRapporteurs
            .map((id) => reporterMap.get(id))
            .filter((x): x is NonNullable<typeof x> => Boolean(x))
            .map((rapporteur) => {
              const initials = getInitials(rapporteur.firstName, rapporteur.lastName);
              return <AvatarInitials key={rapporteur.userId} initials={initials} size="md" />;
            })
        : [];

    return avatars.length > 4 ? avatars.slice(0, 3) : avatars;
  }, [selectedRapporteurs, reporterMap]);

  const buttonLabel =
    avatarsInitials.length > 0 ? (
      <div className="flex flex-wrap items-center gap-2">
        {avatarsInitials}
        {selectedRapporteurs.length > 4 ? (
          <span className="mx-1">{`+${selectedRapporteurs.length - 3}`}</span>
        ) : null}
      </div>
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
