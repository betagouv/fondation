import { useMemo } from 'react';

import { UserAvatarList } from '@/components/shared/user-avatar';

import { useAffectationRow } from '@/components/shared/nomination-files-table/contexts/files-affectations.context';
import { RapporteursDropdownBase } from './RapporteursDropdownBase';

export type InputAffectationProps = {
  dossierId: string;
  initialRapporteurs: string[];
  availableRapporteurs: { userId: string; firstName: string; lastName: string }[];
};

export const DropdownRapporteurs = (props: {
  fileId: string;
  reporters: { userId: string; firstName: string; lastName: string }[];
}) => {
  const { reporterIds, affectReporters } = useAffectationRow(props.fileId);
  const selectedRapporteurs = useMemo(() => reporterIds ?? [], [reporterIds]);

  const reporterMap = useMemo(
    () => new Map(props.reporters.map((reporter) => [reporter.userId, reporter] as const)),
    [props.reporters]
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
      availableRapporteurs={props.reporters}
      selectedRapporteurs={selectedRapporteurs}
      onSelectionChange={affectReporters}
      buttonLabel={buttonLabel}
    />
  );
};
