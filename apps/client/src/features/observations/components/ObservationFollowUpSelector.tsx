import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { useObservationFollowUpCommentDialog } from '@/features/observations/context/ObservationFollowUpCommentContext';
import { ObservationFollowUpEnum } from '@/shared/enums/observation-follow-up.enum';
import { Dropdown } from '@/shared/ui/dropdown';
import { useFollowUpOnObservationMutation } from '@queries/observations.queries';

import { ObservationFollowUpTag } from './ObservationFollowUpTag';

const OPTIONS = Object.values(ObservationFollowUpEnum).map((value) => ({
  value,
  label: <ObservationFollowUpTag followUp={value} />,
}));

export function ObservationFollowUpSelector(props: {
  followUp: ObservationFollowUpEnum | null;
  nominationFileId: string;
  observationId: string;
  sessionId: string;
}) {
  const { mutate: followUpOnObservation, reset, isPending } = useFollowUpOnObservationMutation();
  const { waitForComment } = useObservationFollowUpCommentDialog();
  // the value picked shows until the details are reloaded, then the saved one shows again, even on a failure
  const [picked, pick] = useState<ObservationFollowUpEnum | null | undefined>(undefined);
  const selected = picked === undefined ? props.followUp : picked;

  const select = async (followUp: ObservationFollowUpEnum | null) => {
    pick(followUp);

    let comment: string | null = null;

    if (followUp !== null) {
      const event = await waitForComment(followUp);
      if (event.type === 'drop') {
        pick(undefined);
        return;
      }

      comment = event.value;
    }

    const { sessionId, nominationFileId, observationId } = props;
    followUpOnObservation(
      { comment, followUp, nominationFileId, observationId, sessionId },
      {
        // runs once the mutation's own onSettled has reloaded the details
        onSettled() {
          pick(undefined);
          reset();
        },
      },
    );
  };

  return (
    <Dropdown
      disabled={isPending}
      label={<FormattedMessage defaultMessage="Suite" />}
      onSelect={(value) => select(value as ObservationFollowUpEnum | null)}
      options={OPTIONS}
      placeholder={<FormattedMessage defaultMessage="Sélectionner" />}
      selected={selected}
    />
  );
}
