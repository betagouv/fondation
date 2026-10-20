import React from 'react';

import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import type { PrioriteEnum } from '@/shared/enums/priorite.enum';
import { useMemberListQuery } from '@queries/members.queries';
import {
  useAffectNominationFilesReportersMutation,
  type SessionNominationFile,
} from '@queries/nomination-sessions.queries';

export function useAffectation(props: {
  nominationFile: SessionNominationFile;
  sessionId: string;
  onSaved: () => void;
}) {
  const { nominationFile, onSaved, sessionId } = props;
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
        firstName: member.firstName,
        lastName: member.lastName,
        userId: member.id,
      })),
    [data],
  );

  // a reporter deactivated since is no longer offered, but stays on the file until removed
  const selectedReporters = React.useMemo(() => {
    const byId = new Map(
      [
        ...nominationFile.reporters.map(({ firstName, id, lastName }) => ({
          firstName,
          lastName,
          userId: id,
        })),
        ...availableRapporteurs,
      ].map((reporter) => [reporter.userId, reporter] as const),
    );
    return reporterIds.map((id) => byId.get(id)).filter((reporter) => !!reporter);
  }, [availableRapporteurs, nominationFile.reporters, reporterIds]);

  const prioritiesDirty = !sameValuesIgnoringOrder(priorities, nominationFile.priorities);
  const reportersDirty = !sameValuesIgnoringOrder(
    reporterIds,
    nominationFile.reporters.map((reporter) => reporter.id),
  );

  const { isPending, mutate } = useAffectNominationFilesReportersMutation();

  const save = React.useCallback(
    () =>
      mutate(
        { affectations: [{ nominationFileId: nominationFile.id, priorities, reporterIds }], sessionId },
        { onSuccess: onSaved },
      ),
    [mutate, nominationFile.id, onSaved, priorities, reporterIds, sessionId],
  );

  return {
    availableRapporteurs,
    isPending,
    priorities,
    prioritiesDirty,
    reporterIds,
    reportersDirty,
    save,
    selectedReporters,
    setPriorities,
    setReporterIds,
  };
}

export function sameValuesIgnoringOrder(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((value) => set.has(value));
}
