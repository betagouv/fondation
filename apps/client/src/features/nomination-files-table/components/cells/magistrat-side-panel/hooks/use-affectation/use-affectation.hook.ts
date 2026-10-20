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

  const selectedReporters = useMemo(() => {
    const byId = new Map(availableRapporteurs.map((reporter) => [reporter.userId, reporter] as const));
    return reporterIds.map((id) => byId.get(id)).filter((reporter) => !!reporter);
  }, [availableRapporteurs, reporterIds]);

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

    Promise.all([
      reportersDirty &&
        affectReporters.mutateAsync({ affectations: [{ nominationFileId, reporterIds }], sessionId }),
      prioritiesDirty &&
        updatePriorities.mutateAsync({ items: [{ nominationFileId, priorities }], sessionId }),
    ]).then(onSaved, () =>
      toasts.error({
        description: formatMessage({
          defaultMessage:
            'Les champs encore modifiés ne sont pas enregistrés. Réessayez et prévenez le support si cela persiste.',
        }),
        title: formatMessage({ defaultMessage: "Les modifications n'ont pas été enregistrées" }),
      }),
    );
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
