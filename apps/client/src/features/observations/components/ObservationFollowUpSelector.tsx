import Select from '@codegouvfr/react-dsfr/Select';
import { useCallback, useState, type ChangeEvent } from 'react';
import { useIntl } from 'react-intl';

import { useObservationFollowUpCommentDialog } from '@/features/observations/context/ObservationFollowUpCommentContext';
import {
  ObservationFollowUpEnum,
  ObservationFollowUpEnumMessages,
} from '@/shared/enums/observation-follow-up.enum';
import { useFollowUpOnObservationMutation } from '@queries/observations.queries';

export function ObservationFollowUpSelector(props: {
  sessionId: string;
  nominationFileId: string;
  observationId: string;
  followUp: ObservationFollowUpEnum | null;
  onChange?: (data: { followUp: ObservationFollowUpEnum | null; comment: string | null }) => unknown;
}) {
  const { formatMessage } = useIntl();
  const { mutate: followUpOnObservation, reset, isPending } = useFollowUpOnObservationMutation();
  const { waitForComment } = useObservationFollowUpCommentDialog();
  const [selected, select] = useState(props.followUp ?? 'null');

  const onChange = useCallback(
    async (e: ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value.trim() as ObservationFollowUpEnum | 'null';

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
      followUpOnObservation(
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
    [props, select, waitForComment, followUpOnObservation, reset],
  );

  return (
    <Select
      className="fr-mb-0"
      disabled={isPending}
      label={formatMessage({ defaultMessage: 'Suite' })}
      nativeSelectProps={{
        onChange,
        value: selected,
      }}
    >
      <option key="observation_followUp_null" value={'null'}>
        {formatMessage({ defaultMessage: 'Aucune' })}
      </option>
      {Object.values(ObservationFollowUpEnum).map((value) => (
        <option key={`observation_followUp_${value}`} value={value}>
          {formatMessage(ObservationFollowUpEnumMessages[value])}
        </option>
      ))}
    </Select>
  );
}
