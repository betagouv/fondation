import { useCallback, useMemo, useState } from 'react';

import { useObservationFollowUpReminderModal } from '../observation-follow-up/useObservationFollowUpReminderModal.hook';
import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import { DropdownSelect } from '@/shared/ui/DropdownSelect';
import type { NominationFileOutcomeEnum } from '@/types/enums.types';
import {
  useDefineNominationFileOutcomeMutation,
  type SessionNominationFile,
} from '@queries/nomination-sessions.queries';

import { outcomeRequiresComment, sessionOutcomeLabel } from './nomination-file-outcome.utils';
import { NominationFileOutcomeBadge } from './NominationFileOutcomeBadge';
import { useOutcomeCommentDialog } from './OutcomeCommentModalContext';

export function NominationFileOutcomeSelector(props: { nominationFile: SessionNominationFile }) {
  const nominationFileId = useMemo(() => props.nominationFile.id, [props]);
  const initialOutcome = useMemo(() => props.nominationFile.content.outcome?.value, [props]);

  const [outcome, setOutcome] = useState<NominationFileOutcomeEnum | '@@EMPTY'>(
    initialOutcome ?? ('@@EMPTY' as const),
  );

  const { sessionId, formation, outcomes } = useNominationFilesTable();
  const outcomeCommentDialog = useOutcomeCommentDialog();
  const observationFollowUps = useObservationFollowUpReminderModal();
  const { mutate, reset, isPending } = useDefineNominationFileOutcomeMutation({
    sessionId,
    nominationFileId,
  });

  const onChange = useCallback(
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

  const onOutcomeChange = useCallback(
    async (outcome: NominationFileOutcomeEnum | '@@EMPTY') => {
      if (outcome === '@@EMPTY') {
        setOutcome('@@EMPTY');
        onChange({ value: null, comment: null });
        return;
      }

      if (!outcomeRequiresComment(outcomes, outcome)) {
        setOutcome(outcome);
        onChange({ value: outcome, comment: null });
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
    [setOutcome, onChange, reset, outcomeCommentDialog, outcomes],
  );

  const baseOptions = useMemo(() => outcomes.map(({ value }) => value), [outcomes]);
  const options = useMemo(
    () =>
      (['@@EMPTY', ...baseOptions] as const).map((value) =>
        value === '@@EMPTY'
          ? { value, label: <span className="fr-pl-1v text-xs">AUCUNE</span>, selected: 'Issue' }
          : {
              value,
              label: (
                <NominationFileOutcomeBadge
                  formation={formation}
                  key={`outcome_option_${value}`}
                  outcome={value}
                />
              ),
              selected: (
                <NominationFileOutcomeBadge
                  acronym
                  formation={formation}
                  key={`acronym_outcome_option_${value}`}
                  label={sessionOutcomeLabel(outcomes, value)}
                  outcome={value}
                />
              ),
            },
      ),
    [baseOptions, formation, outcomes],
  );

  return <DropdownSelect disabled={isPending} onChange={onOutcomeChange} options={options} value={outcome} />;
}
