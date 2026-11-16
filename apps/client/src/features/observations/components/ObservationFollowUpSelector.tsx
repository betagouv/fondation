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
  followUp: ObservationFollowUpEnum | null;
  nominationFileId: string;
  observationId: string;
  sessionId: string;
}) {
  const { formatMessage } = useIntl();
  const { mutate: followUpOnObservation, reset, isPending } = useFollowUpOnObservationMutation();
  const { waitForComment } = useObservationFollowUpCommentDialog();
  // the value picked shows until the details are reloaded, then the saved one shows again, even on a failure
  const [picked, pick] = useState<ObservationFollowUpEnum | 'null' | null>(null);
  const selected = picked ?? props.followUp ?? 'null';

  const onChange = useCallback(
    async (e: ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value.trim() as ObservationFollowUpEnum | 'null';

      pick(value);

      let comment: string | null = null;

      if (value !== 'null') {
        const event = await waitForComment(value);
        if (event.type === 'drop') {
          pick(null);
          return;
        }

        comment = event.value;
      }

      const followUp = value === 'null' ? null : value;
      const { sessionId, nominationFileId, observationId } = props;
      followUpOnObservation(
        { comment, followUp, nominationFileId, observationId, sessionId },
        {
          // runs once the mutation's own onSettled has reloaded the details
          onSettled() {
            pick(null);
            reset();
          },
        },
      );
    },
    [props, pick, waitForComment, followUpOnObservation, reset],
  );

  return (
    <Select
      className="fr-mb-0"
      disabled={isPending}
      label={formatMessage({ defaultMessage: 'Suite' })}
      nativeSelectProps={{
        disabled: isPending,
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
