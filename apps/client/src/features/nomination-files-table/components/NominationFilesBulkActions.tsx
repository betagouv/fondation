import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import {
  useExcludedJurisdictions,
  useExcludedJurisdictionTitles,
} from '../context/excluded-jurisdictions.context';
import { useNominationFilesTable } from '../context/files-table.context';
import { OutcomeBadge } from '@/shared/components/outcome-badge';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import type { NominationFileOutcomeEnum } from '@/shared/enums/nomination-file-outcome.enum';
import type { PrioriteEnum } from '@/shared/enums/priorite.enum';
import { Dropdown } from '@/shared/ui/dropdown';
import { useToasts } from '@/shared/ui/toast';
import type { RecusedMembersDto } from '@api/types';
import { useMemberListQuery } from '@queries/members.queries';
import {
  useAffectNominationFilesReportersMutation,
  useDefineNominationFilesOutcomeMutation,
  useRecuseNominationFilesMembersMutation,
  useUpdateNominationFilesPrioritiesMutation,
  type SessionNominationFile,
} from '@queries/nomination-sessions.queries';

import {
  PrioritySelect,
  ReporterSelect,
} from './cells/magistrat-side-panel/components/header/AffectationFields';
import { AffectedRecusedMembersNotice } from './cells/magistrat-side-panel/components/recused-members/AffectedRecusedMembersNotice';
import {
  affectedRecusedMembers,
  blockedRecusals,
  isNonRecusableOn,
} from './cells/magistrat-side-panel/components/recused-members/recused-reporters';
import { RecusedMemberSelect } from './cells/magistrat-side-panel/components/recused-members/RecusedMemberSelect';
import { RecusedReportersNotice } from './cells/magistrat-side-panel/components/recused-members/RecusedReportersNotice';
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

function isChanged(previous: readonly string[], next: readonly string[]): boolean {
  const { added, removed } = diff(previous, next);
  return added.length > 0 || removed.length > 0;
}

function sharedList<T extends string>(
  files: readonly SessionNominationFile[],
  valuesOf: (file: SessionNominationFile) => readonly T[],
): T[] {
  const [first, ...others] = files.map((file) => [...valuesOf(file)].sort());
  if (!first) return [];

  const isShared = others.every(
    (values) => values.length === first.length && values.every((value, index) => value === first[index]),
  );

  return isShared ? first : [];
}

function recusedIdsOf(file: SessionNominationFile): string[] {
  return file.recusedMembers.map(({ id }) => id);
}

function sharedRecusedMembers(files: readonly SessionNominationFile[]): RecusedMembersDto['recusedMembers'] {
  const isShared = sharedList(files, recusedIdsOf).length > 0;

  return isShared ? files[0]!.recusedMembers : [];
}

function sharedOutcome(files: readonly SessionNominationFile[]): NominationFileOutcomeEnum | null {
  const outcomes = files.map((file) => file.content.outcome?.value ?? null);
  const [first] = outcomes;
  if (!first) return null;

  return outcomes.every((outcome) => outcome === first) ? first : null;
}

export function NominationFilesBulkActions(props: {
  onClose: () => void;
  selectedFiles: readonly SessionNominationFile[];
}) {
  const { formatMessage } = useIntl();
  const { formation, outcomes, sessionId } = useNominationFilesTable();
  const toasts = useToasts();
  const { waitForConfirmation } = useConfirmModal();

  const affectReporters = useAffectNominationFilesReportersMutation();
  const defineOutcome = useDefineNominationFilesOutcomeMutation({ sessionId });
  const recuseMembers = useRecuseNominationFilesMembersMutation({ sessionId });
  const updatePriorities = useUpdateNominationFilesPrioritiesMutation();

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

  const shared = useMemo(
    () => ({
      outcome: sharedOutcome(props.selectedFiles),
      priorities: sharedList(props.selectedFiles, (file) => file.priorities),
      recusedMembers: sharedRecusedMembers(props.selectedFiles),
      reporterIds: sharedList(props.selectedFiles, (file) => file.reporters.map(({ id }) => id)),
    }),
    [props.selectedFiles],
  );

  const [reporterIds, setReporterIds] = useState(shared.reporterIds);
  const [priorities, setPriorities] = useState(shared.priorities);
  const [recusedMemberIds, setRecusedMemberIds] = useState(shared.recusedMembers.map(({ id }) => id));
  const [outcome, setOutcome] = useState(shared.outcome);
  const [commentedOutcome, setCommentedOutcome] = useState<NominationFileOutcomeEnum | null>(null);

  const hasSelection = props.selectedFiles.length > 0;
  const canRecuseMembers = hasSelection && props.selectedFiles.every((file) => file.canRecuseMembers);
  const isApplying =
    affectReporters.isPending ||
    defineOutcome.isPending ||
    recuseMembers.isPending ||
    updatePriorities.isPending;

  useEffect(() => {
    setReporterIds(shared.reporterIds);
    setPriorities(shared.priorities);
    setRecusedMemberIds(shared.recusedMembers.map(({ id }) => id));
    setOutcome(shared.outcome);
  }, [shared]);

  const changeReporters = useCallback(
    async (next: string[]) => {
      if (!hasSelection) return;

      const change = diff(reporterIds, next);
      const recusedMembers = affectedRecusedMembers(props.selectedFiles, change.added);
      if (recusedMembers.length > 0) {
        const { isConfirmed } = await waitForConfirmation({
          content: <AffectedRecusedMembersNotice members={recusedMembers} />,
          i18n: {
            cancel: formatMessage({ defaultMessage: 'Annuler' }),
            confirm: formatMessage({ defaultMessage: 'Affecter' }),
          },
          title:
            recusedMembers.length > 1
              ? formatMessage({ defaultMessage: 'Affecter des membres déportés' })
              : formatMessage({ defaultMessage: 'Affecter un membre déporté' }),
        });
        if (!isConfirmed) return;
      }

      setReporterIds(next);

      affectReporters.mutate(
        {
          affectations: props.selectedFiles.map((file) => ({
            nominationFileId: file.id,
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
    [
      affectReporters,
      formatMessage,
      hasSelection,
      onFailure,
      props.selectedFiles,
      reporterIds,
      sessionId,
      waitForConfirmation,
    ],
  );

  const clearReporters = useCallback(() => {
    if (!hasSelection) return;

    setReporterIds([]);

    affectReporters.mutate(
      {
        affectations: props.selectedFiles.map((file) => ({ nominationFileId: file.id, reporterIds: [] })),
        sessionId,
      },
      { onError: onFailure },
    );
  }, [affectReporters, hasSelection, onFailure, props.selectedFiles, sessionId]);

  const changePriorities = useCallback(
    (next: PrioriteEnum[]) => {
      if (!hasSelection) return;

      const change = diff(priorities, next);
      setPriorities(next);

      updatePriorities.mutate(
        {
          items: props.selectedFiles.map((file) => ({
            nominationFileId: file.id,
            priorities: applyChange(file.priorities, change) as PrioriteEnum[],
          })),
          sessionId,
        },
        { onError: onFailure },
      );
    },
    [hasSelection, onFailure, priorities, props.selectedFiles, sessionId, updatePriorities],
  );

  const changeRecusedMembers = useCallback(
    async (next: string[]) => {
      if (!hasSelection) return;

      const change = diff(recusedMemberIds, next);
      const items = props.selectedFiles.map((file) => ({
        before: recusedIdsOf(file),
        memberIds: applyChange(recusedIdsOf(file), {
          added: change.added.filter((id) => !isNonRecusableOn(file, id)),
          removed: change.removed,
        }),
        nominationFileId: file.id,
      }));
      const reporters = blockedRecusals(props.selectedFiles, change.added, members?.items ?? []);
      if (reporters.length > 0) {
        const hasOtherPropositions = items.some(({ before, memberIds }) => isChanged(before, memberIds));
        const { isConfirmed } = await waitForConfirmation({
          content: (
            <RecusedReportersNotice hasOtherPropositions={hasOtherPropositions} reporters={reporters} />
          ),
          i18n: hasOtherPropositions
            ? {
                cancel: formatMessage({ defaultMessage: 'Annuler' }),
                confirm: formatMessage({ defaultMessage: 'Déporter' }),
              }
            : { cancel: formatMessage({ defaultMessage: 'Fermer' }), confirm: null },
          title:
            reporters.length > 1
              ? formatMessage({ defaultMessage: 'Déporter des rapporteurs' })
              : formatMessage({ defaultMessage: 'Déporter un rapporteur' }),
        });
        if (!isConfirmed) return;
      }

      setRecusedMemberIds(next);

      recuseMembers.mutate(
        { items: items.map(({ memberIds, nominationFileId }) => ({ memberIds, nominationFileId })) },
        { onError: onFailure },
      );
    },
    [
      formatMessage,
      hasSelection,
      members,
      onFailure,
      props.selectedFiles,
      recuseMembers,
      recusedMemberIds,
      waitForConfirmation,
    ],
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
        <PrioritySelect disabled={isApplying} onChange={changePriorities} value={priorities} />
        <ReporterSelect
          available={availableReporters}
          disabled={isApplying}
          excludedTitleByRapporteurId={excludedTitleByRapporteurId}
          onChange={changeReporters}
          onClear={clearReporters}
          value={reporterIds}
        />
        {canRecuseMembers && (
          <RecusedMemberSelect
            disabled={isApplying}
            label={<FormattedMessage defaultMessage="Membres déportés" />}
            onChange={changeRecusedMembers}
            recusedMembers={shared.recusedMembers}
            value={recusedMemberIds}
          />
        )}
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
