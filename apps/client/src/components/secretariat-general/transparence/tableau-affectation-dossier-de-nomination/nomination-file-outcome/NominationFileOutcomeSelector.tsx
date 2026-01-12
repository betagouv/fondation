import React, { useMemo } from 'react';

import { DropdownSelect } from '@/components/shared/DropdownSelect';
import type { FormationEnum, NominationFileOutcomeEnum } from '@/types/enums.types';
import { useDefineNominationFileOutcomeMutation } from '@queries/nomination-sessions.queries';
import { NominationFileOutcomeBadge, NominationFileOutcomeShortBadge } from './NominationFileOutcomeBadge';
import { useOutcomeCommentDialog } from './OutcomeCommentModalContext';

const NOMINATION_FILE_OUTCOME_OPTIONS = [
  '@@EMPTY',
  'VALIDATED',
  'NON_VALIDATED',
  'SUSPENDED',
  'REMOVED',
  'WITHDRAWN'
] as const satisfies ('@@EMPTY' | NominationFileOutcomeEnum)[];

export function NominationFileOutcomeSelector(props: {
  sessionId: string;
  nominationFileId: string;
  formation: FormationEnum;
  value: NominationFileOutcomeEnum | null;
}) {
  const [outcome, setOutcome] = React.useState<NominationFileOutcomeEnum | '@@EMPTY'>(
    props.value ?? ('@@EMPTY' as const)
  );

  const outcomeCommentDialog = useOutcomeCommentDialog();
  const { mutate, reset, isPending } = useDefineNominationFileOutcomeMutation({
    sessionId: props.sessionId,
    nominationFileId: props.nominationFileId
  });

  const onChange = React.useCallback(
    (changedOutcome: { value: NominationFileOutcomeEnum | null; comment: string | null }) => {
      mutate(
        changedOutcome.value
          ? { outcome: changedOutcome.value, comment: changedOutcome.comment }
          : { outcome: null, comment: null },
        {
          onSettled() {
            reset();
          },
          onError(error) {
            console.error(error);
          }
        }
      );
    },
    [mutate, reset]
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
    [setOutcome, onChange, reset, outcomeCommentDialog]
  );

  const options = useMemo(
    () =>
      NOMINATION_FILE_OUTCOME_OPTIONS.map((value) =>
        value === '@@EMPTY'
          ? { value, label: <span className="text-xs">SANS ISSUE</span> }
          : {
              value,
              label: (
                <NominationFileOutcomeBadge
                  formation={props.formation}
                  outcome={value}
                  key={`outcome_option_${value}`}
                />
              ),
              selected: (
                <NominationFileOutcomeShortBadge
                  formation={props.formation}
                  outcome={value}
                  key={`short_outcome_option_${value}`}
                />
              )
            }
      ),
    [props.formation]
  );

  return (
    <>
      <DropdownSelect
        options={options}
        placeholder="SANS ISSUE"
        disabled={isPending}
        value={outcome}
        onChange={onOutcomeChange}
      />
    </>
  );
}
