import Select from '@codegouvfr/react-dsfr/Select';
import React from 'react';

import { useIsSg } from '@/hooks/roles.hook';
import {
  ObservationFollowUpEnum,
  ObservationFollowUpEnumLabels,
  type ObservationFollowupEnum,
} from '@/types/enums.types';
import { useFollowUpOnObservationMutation } from '@queries/observations.queries';

import { useObservationFollowUpCommentDialog } from './useObservationFollowUpCommentDialog';

export function ObservationFollowUpSelector(props: {
  sessionId: string;
  nominationFileId: string;
  observationId: string;
  followUp: ObservationFollowupEnum | null;
  comment: string | null;
  onChange?: (data: { followUp: ObservationFollowupEnum | null; comment: string | null }) => unknown;
}) {
  const isSg = useIsSg();
  const { mutateAsync, reset, isPending } = useFollowUpOnObservationMutation();
  const { waitForComment } = useObservationFollowUpCommentDialog();
  const [selected, select] = React.useState(props.followUp ?? 'null');

  const onChange = React.useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value.trim() as ObservationFollowupEnum | 'null';

      select(value);

      let comment: string | null = null;

      if (value !== 'null') {
        const event = await waitForComment(value);
        if (event.type === 'drop') {
          select(props.followUp ?? 'null');
          return;
        }

        comment = event.value;
      }

      const followUp = value === 'null' ? null : value;
      const { sessionId, nominationFileId, observationId } = props;
      await mutateAsync(
        {
          sessionId,
          nominationFileId,
          observationId,
          comment,
          followUp,
        },
        {
          onSettled() {
            reset();
          },
          onSuccess() {
            props.onChange?.({ comment, followUp });
          },
        },
      );
    },
    [props, select, waitForComment, mutateAsync, reset],
  );

  if (!isSg) return null;

  return (
    <div>
      <Select
        label="Suite"
        className="!mb-0"
        nativeSelectProps={{
          onChange,
          value: selected,
          disabled: isPending,
        }}
      >
        <option key="observation_followUp_null" value={'null'}>
          Aucune
        </option>
        {Object.values(ObservationFollowUpEnum).map((value) => (
          <option key={`observation_followUp_${value}`} value={value}>
            {ObservationFollowUpEnumLabels[value]}
          </option>
        ))}
      </Select>
      {props.comment && <p className="mb-0 mt-2 p-0 text-sm font-normal italic">{props.comment}</p>}
    </div>
  );
}
