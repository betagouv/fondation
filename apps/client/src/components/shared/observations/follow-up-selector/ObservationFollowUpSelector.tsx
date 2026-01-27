import {
  ObservationFollowUpEnum,
  ObservationFollowUpEnumLabels,
  type ObservationFollowupEnum
} from '@/types/enums.types';
import Select from '@codegouvfr/react-dsfr/Select';
import React from 'react';
import { useObservationFollowUpCommentDialog } from './useObservationFollowUpCommentDialog';
import { useFollowUpOnObservationMutation } from '@queries/observations.queries';
import { useIsSg } from '@/hooks/roles.hook';

export function ObservationFollowUpSelector(props: {
  sessionId: string;
  nominationFileId: string;
  observationId: string;
  followUp: ObservationFollowupEnum | null;
  comment: string | null;
}) {
  const isSg = useIsSg();
  const { mutate, isPending } = useFollowUpOnObservationMutation();
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

      const { sessionId, nominationFileId, observationId } = props;
      mutate({
        sessionId,
        nominationFileId,
        observationId,
        comment,
        followUp: value === 'null' ? null : value
      });
    },
    [props, select, waitForComment, mutate]
  );

  if (!isSg) return null;

  return (
    <Select
      label="Suite"
      nativeSelectProps={{
        onChange,
        value: selected,
        disabled: isPending
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
  );
}
