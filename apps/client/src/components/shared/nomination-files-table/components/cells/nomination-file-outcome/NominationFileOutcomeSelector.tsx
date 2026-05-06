import React, { useMemo } from 'react';

import { useObservationFollowUpReminderModal } from '../observation-follow-up/useObservationFollowUpReminderModal.hook';
import { DropdownSelect } from '@/components/shared/DropdownSelect';
import { useNominationFilesTable } from '@/components/shared/nomination-files-table/contexts/files-table.context';
import type { NominationFileOutcomeEnum } from '@/types/enums.types';
import {
  useDefineNominationFileOutcomeMutation,
  type SessionNominationFile,
} from '@queries/nomination-sessions.queries';

import { useSortedNominationFileOutcomes } from './nomination-file-outcome-badge.utils';
import { NominationFileOutcomeBadge } from './NominationFileOutcomeBadge';
import { useOutcomeCommentDialog } from './OutcomeCommentModalContext';

export function NominationFileOutcomeSelector(props: { nominationFile: SessionNominationFile }) {
  const nominationFileId = React.useMemo(() => props.nominationFile.id, [props]);
  const initialOutcome = React.useMemo(() => props.nominationFile.content.outcome?.value, [props]);

  const [outcome, setOutcome] = React.useState<NominationFileOutcomeEnum | '@@EMPTY'>(
    initialOutcome ?? ('@@EMPTY' as const),
  );

  const { sessionId, formation } = useNominationFilesTable();
  const outcomeCommentDialog = useOutcomeCommentDialog();
  const observationFollowUps = useObservationFollowUpReminderModal();
  const { mutate, reset, isPending } = useDefineNominationFileOutcomeMutation({
    sessionId,
    nominationFileId,
  });

  const onChange = React.useCallback(
    (changedOutcome: { value: NominationFileOutcomeEnum | null; comment: string | null }) => {
      mutate(
        changedOutcome.value
          ? { outcome: changedOutcome.value, comment: changedOutcome.comment }
          : { outcome: null, comment: null },
        {
          onSuccess() {
            if (changedOutcome.value === null) return;

            observationFollowUps.remindOfObservationFollowUpIfNecessary(props.nominationFile);
          },
          onSettled() {
            reset();
          },
          onError(error) {
            console.error(error);
          },
        },
      );
    },
    [mutate, reset, observationFollowUps, props.nominationFile],
  );

  const onOutcomeChange = React.useCallback(
    async (outcome: NominationFileOutcomeEnum | '@@EMPTY') => {
      if (outcome === '@@EMPTY') {
        setOutcome('@@EMPTY');
        onChange({ value: null, comment: null });
        return;
      }

      const event = await outcomeCommentDialog.waitForOutcomeComment(outcome);
      if (event.type === 'drop') {
        reset();
        return;
      }

      setOutcome(outcome);
      onChange({ value: outcome, comment: event.value });
    },
    [setOutcome, onChange, reset, outcomeCommentDialog],
  );

  const baseOptions = useSortedNominationFileOutcomes();
  const options = useMemo(
    () =>
      (['@@EMPTY', ...baseOptions] as const).map((value) =>
        value === '@@EMPTY'
          ? { value, label: <span className="pl-1 text-xs">AUCUNE</span>, selected: 'Issue' }
          : {
              value,
              label: (
                <NominationFileOutcomeBadge
                  formation={formation}
                  outcome={value}
                  key={`outcome_option_${value}`}
                />
              ),
              selected: (
                <NominationFileOutcomeBadge
                  short
                  formation={formation}
                  outcome={value}
                  key={`short_outcome_option_${value}`}
                />
              ),
            },
      ),
    [baseOptions, formation],
  );

  return <DropdownSelect options={options} disabled={isPending} value={outcome} onChange={onOutcomeChange} />;
}
