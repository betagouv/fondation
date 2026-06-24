import React from 'react';

import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import type { PrioriteEnum } from '@/types/enums.types';
import { useMemberListQuery } from '@queries/members.queries';
import {
  useAffectNominationFilesReportersMutation,
  type SessionNominationFile,
} from '@queries/nomination-sessions.queries';

export function useMagistratAffectation(props: {
  nominationFile: SessionNominationFile;
  sessionId: string;
  onSaved: () => void;
}) {
  const { nominationFile, sessionId, onSaved } = props;
  const { formation } = useNominationFilesTable();

  const [priorities, setPriorities] = React.useState<PrioriteEnum[]>(() => [...nominationFile.priorities]);
  const [reporterIds, setReporterIds] = React.useState<string[]>(() =>
    nominationFile.reporters.map((reporter) => reporter.id),
  );

  const { data } = useMemberListQuery({
    formations: ['COMMUN', formation],
    pagination: { pageIndex: 0, pageSize: 100 },
  });

  const availableRapporteurs = React.useMemo(
    () =>
      (data?.items ?? []).map((member) => ({
        userId: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
      })),
    [data],
  );

  const selectedReporters = React.useMemo(() => {
    const byId = new Map(availableRapporteurs.map((reporter) => [reporter.userId, reporter] as const));
    return reporterIds.map((id) => byId.get(id)).filter((reporter) => !!reporter);
  }, [availableRapporteurs, reporterIds]);

  const { mutate, isPending } = useAffectNominationFilesReportersMutation();

  const save = React.useCallback(
    () =>
      mutate(
        { sessionId, affectations: [{ nominationFileId: nominationFile.id, reporterIds, priorities }] },
        { onSuccess: onSaved },
      ),
    [mutate, sessionId, nominationFile.id, reporterIds, priorities, onSaved],
  );

  return {
    priorities,
    setPriorities,
    reporterIds,
    setReporterIds,
    availableRapporteurs,
    selectedReporters,
    save,
    isPending,
  };
}
