import type { SessionNominationFile } from '@queries/nomination-sessions.queries';
import React from 'react';
import { ObservationFollowUpReminderContext } from './ObservationFollowUpReminderContext';
import { observationFollowUpReminderModal } from './ObservationFollowUpReminderModal';

export function useObservationFollowUpReminderModal() {
  const ctx = React.useContext(ObservationFollowUpReminderContext);

  const remindOfObservationFollowUpIfNecessary = React.useCallback(
    (nominationFile: SessionNominationFile) => {
      if (nominationFile.observations.some((observation) => observation.followUp === null)) {
        ctx.setNominationFile(nominationFile);
        observationFollowUpReminderModal.open();
      }
    },
    [ctx]
  );

  if (!ctx) throw new Error('Unknown ObservationFollowUpReminderContext');

  return { remindOfObservationFollowUpIfNecessary };
}
