import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import {
  useExcludedJurisdictions,
  useExcludedJurisdictionTitles,
} from '../context/excluded-jurisdictions.context';
import { useNominationFilesTable } from '../context/files-table.context';
import { OutcomeBadge } from '@/shared/components/outcome-badge';
import { Dropdown } from '@/shared/ui/dropdown';
import { useToasts } from '@/shared/ui/toast';
import type { NominationFileOutcomeEnum, PrioriteEnum } from '@/types/enums.types';
import { useMemberListQuery } from '@queries/members.queries';
import {
  useAffectNominationFilesReportersMutation,
  useDefineNominationFilesOutcomeMutation,
  type SessionNominationFile,
} from '@queries/nomination-sessions.queries';

import {
  PrioritySelect,
  ReporterSelect,
} from './cells/magistrat-side-panel/components/header/AffectationFields';
import { outcomeRequiresComment } from './cells/nomination-file-outcome/nomination-file-outcome.utils';
import { RequiredOutcomeCommentsModal, type OutcomeComment } from './RequiredOutcomeCommentsModal';

function applyChange(
  current: readonly string[],
  change: { added: readonly string[]; removed: readonly string[] },
): string[] {
  const next = new Set([...current, ...change.added]);
  for (const value of change.removed) next.delete(value);

  return [...next];
}

function diff(previous: readonly string[], next: readonly string[]) {
  return {
    added: next.filter((value) => !previous.includes(value)),
    removed: previous.filter((value) => !next.includes(value)),
  };
}

export function NominationFilesBulkActions(props: {
  onClose: () => void;
  selectedFiles: readonly SessionNominationFile[];
}) {
  const { formatMessage } = useIntl();
  const { formation, outcomes, sessionId } = useNominationFilesTable();
  const toasts = useToasts();

  const affectReporters = useAffectNominationFilesReportersMutation();
  const defineOutcome = useDefineNominationFilesOutcomeMutation({ sessionId });

  const { data: members } = useMemberListQuery({
    formations: ['COMMUN', formation],
    pagination: { pageIndex: 0, pageSize: 100 },
  });

  const availableReporters = useMemo(
    () =>
      (members?.items ?? []).map((member) => ({
        firstName: member.firstName,
        lastName: member.lastName,
        userId: member.id,
      })),
    [members],
  );

  const excludedJurisdictions = useExcludedJurisdictions();
  const conflicts = props.selectedFiles.flatMap((file) =>
    excludedJurisdictions.conflictsFor(
      file,
      availableReporters.map(({ userId }) => userId),
    ),
  );
  const excludedTitleByRapporteurId = useExcludedJurisdictionTitles(conflicts);

  const onFailure = useCallback(
    () =>
      toasts.error({
        description: formatMessage({
          defaultMessage: 'Réessayez et prévenez le support si cela persiste.',
        }),
        title: formatMessage({ defaultMessage: "L'action groupée a échoué" }),
      }),
    [formatMessage, toasts],
  );

  const [reporterIds, setReporterIds] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<PrioriteEnum[]>([]);
  const [outcome, setOutcome] = useState<NominationFileOutcomeEnum | null>(null);
  const [commentedOutcome, setCommentedOutcome] = useState<NominationFileOutcomeEnum | null>(null);

  const hasSelection = props.selectedFiles.length > 0;
  const isApplying = affectReporters.isPending || defineOutcome.isPending;
  useEffect(() => {
    if (hasSelection) return;

    setReporterIds([]);
    setPriorities([]);
    setOutcome(null);
  }, [hasSelection]);

  const changeReporters = useCallback(
    (next: string[]) => {
      if (!hasSelection) return;

      const change = diff(reporterIds, next);
      setReporterIds(next);

      affectReporters.mutate(
        {
          affectations: props.selectedFiles.map((file) => ({
            nominationFileId: file.id,
            priorities: file.priorities,
            reporterIds: applyChange(
              file.reporters.map(({ id }) => id),
              change,
            ),
          })),
          sessionId,
        },
        { onError: onFailure },
      );
    },
    [affectReporters, hasSelection, onFailure, props.selectedFiles, reporterIds, sessionId],
  );

  const changePriorities = useCallback(
    (next: PrioriteEnum[]) => {
      if (!hasSelection) return;

      const change = diff(priorities, next);
      setPriorities(next);

      affectReporters.mutate(
        {
          affectations: props.selectedFiles.map((file) => ({
            nominationFileId: file.id,
            priorities: applyChange(file.priorities, change) as PrioriteEnum[],
            reporterIds: file.reporters.map(({ id }) => id),
          })),
          sessionId,
        },
        { onError: onFailure },
      );
    },
    [affectReporters, hasSelection, onFailure, priorities, props.selectedFiles, sessionId],
  );

  const chooseOutcome = useCallback(
    (value: string | null) => {
      if (!hasSelection) return;

      const next = value as NominationFileOutcomeEnum | null;
      if (next && outcomeRequiresComment(outcomes, next)) return setCommentedOutcome(next);

      setOutcome(next);
      defineOutcome.mutate(
        {
          items: props.selectedFiles.map((file) => ({
            comment: next ? (file.content.outcome?.comment ?? null) : null,
            nominationFileId: file.id,
          })),
          outcome: next,
        },
        { onError: onFailure },
      );
    },
    [defineOutcome, hasSelection, onFailure, outcomes, props.selectedFiles],
  );

  const saveOutcomeComments = useCallback(
    (items: readonly OutcomeComment[]) => {
      defineOutcome.mutate({ items, outcome: commentedOutcome }, { onError: onFailure });
      setOutcome(commentedOutcome);
      setCommentedOutcome(null);
    },
    [commentedOutcome, defineOutcome, onFailure],
  );

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-6">
        <ReporterSelect
          available={availableReporters}
          disabled={isApplying}
          excludedTitleByRapporteurId={excludedTitleByRapporteurId}
          onChange={changeReporters}
          value={reporterIds}
        />
        <PrioritySelect disabled={isApplying} onChange={changePriorities} value={priorities} />
        <Dropdown
          disabled={isApplying}
          label={<FormattedMessage defaultMessage="Choisir une issue" />}
          onSelect={chooseOutcome}
          options={outcomes.map(({ value }) => ({
            label: <OutcomeBadge formation={formation} outcome={value} small={false} />,
            value,
          }))}
          placeholder={<FormattedMessage defaultMessage="Sélectionner" />}
          selected={outcome}
        />
      </div>

      <Button iconId="fr-icon-close-line" onClick={props.onClose} priority="tertiary no outline">
        <FormattedMessage defaultMessage="Fermer" />
      </Button>

      {commentedOutcome && (
        <RequiredOutcomeCommentsModal
          files={props.selectedFiles}
          onClosed={() => setCommentedOutcome(null)}
          onConfirm={saveOutcomeComments}
          onDrop={() => setCommentedOutcome(null)}
          open
          outcome={commentedOutcome}
        />
      )}
    </div>
  );
}
