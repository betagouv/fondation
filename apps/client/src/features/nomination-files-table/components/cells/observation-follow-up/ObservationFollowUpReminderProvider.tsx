import React from 'react';

import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { ObservationFollowUpReminderContext } from './ObservationFollowUpReminderContext';
import { ObservationFollowUpReminderModal } from './ObservationFollowUpReminderModal';

export function ObservationFollowUpReminderProvider(props: React.PropsWithChildren) {
  const [nominationFile, setNominationFile] = React.useState<SessionNominationFile | null>(null);

  const onClose = React.useCallback(() => {
    setNominationFile(null);
  }, [setNominationFile]);

  return (
    <ObservationFollowUpReminderContext value={{ nominationFile, setNominationFile }}>
      <ObservationFollowUpReminderModal onClose={onClose} nominationFile={nominationFile} />

      {props.children}
    </ObservationFollowUpReminderContext>
  );
}
