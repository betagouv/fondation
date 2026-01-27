import type { SessionNominationFile } from '@queries/nomination-sessions.queries';
import React from 'react';

type ObservationFollowUpReminderContextType = {
  nominationFile: SessionNominationFile | null;
  setNominationFile: (file: SessionNominationFile | null) => void;
};

export const ObservationFollowUpReminderContext = React.createContext(
  null as unknown as ObservationFollowUpReminderContextType
);
