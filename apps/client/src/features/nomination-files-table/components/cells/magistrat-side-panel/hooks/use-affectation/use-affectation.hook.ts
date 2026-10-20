import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';

import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import type { PrioriteEnum } from '@/shared/enums/priorite.enum';
import { useToasts } from '@/shared/ui/toast';
import { useMemberListQuery } from '@queries/members.queries';
import {
  useAffectNominationFilesReportersMutation,
  useUpdateNominationFilesPrioritiesMutation,
  type SessionNominationFile,
} from '@queries/nomination-sessions.queries';

export function useAffectation(props: {
  nominationFile: SessionNominationFile;
  onSaved: () => void;
  sessionId: string;
}) {
  const { nominationFile, onSaved, sessionId } = props;
  const { formation } = useNominationFilesTable();

  const [priorities, setPriorities] = useState<PrioriteEnum[]>(() => [...nominationFile.priorities]);
  const [reporterIds, setReporterIds] = useState<string[]>(() =>
    nominationFile.reporters.map((reporter) => reporter.id),
  );

  const { data } = useMemberListQuery({
    formations: ['COMMUN', formation],
    pagination: { pageIndex: 0, pageSize: 100 },
  });

  const availableRapporteurs = useMemo(
    () =>
      (data?.items ?? []).map((member) => ({
        firstName: member.firstName,
        lastName: member.lastName,
        userId: member.id,
      })),
    [data],
  );

  // a reporter deactivated since is no longer offered, but stays on the file until removed
  const selectedReporters = useMemo(() => {
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

  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const affectReporters = useAffectNominationFilesReportersMutation();
  const updatePriorities = useUpdateNominationFilesPrioritiesMutation();
  const isPending = affectReporters.isPending || updatePriorities.isPending;

  const save = useCallback(() => {
    const nominationFileId = nominationFile.id;

    void Promise.allSettled([
      reportersDirty &&
        affectReporters.mutateAsync({ affectations: [{ nominationFileId, reporterIds }], sessionId }),
      prioritiesDirty &&
        updatePriorities.mutateAsync({ items: [{ nominationFileId, priorities }], sessionId }),
    ]).then(([reporters, priorities]) => {
      const reportersFailed = reporters.status === 'rejected';
      const prioritiesFailed = priorities.status === 'rejected';
      if (!reportersFailed && !prioritiesFailed) return onSaved();

      toasts.error({
        description: formatMessage({ defaultMessage: 'Réessayez et prévenez le support si cela persiste.' }),
        title:
          reportersFailed && prioritiesFailed
            ? formatMessage({ defaultMessage: "Les rapporteurs et les priorités n'ont pas été enregistrés" })
            : reportersFailed
              ? formatMessage({ defaultMessage: "Les rapporteurs n'ont pas été enregistrés" })
              : formatMessage({ defaultMessage: "Les priorités n'ont pas été enregistrées" }),
      });
    });
  }, [
    affectReporters,
    formatMessage,
    nominationFile.id,
    onSaved,
    priorities,
    prioritiesDirty,
    reporterIds,
    reportersDirty,
    sessionId,
    toasts,
    updatePriorities,
  ]);

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
