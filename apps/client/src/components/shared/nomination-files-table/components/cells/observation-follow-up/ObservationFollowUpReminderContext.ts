import React from 'react';

import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

type ObservationFollowUpReminderContextType = {
  nominationFile: SessionNominationFile | null;
  setNominationFile: (file: SessionNominationFile | null) => void;
};

export const ObservationFollowUpReminderContext = React.createContext(
  null as unknown as ObservationFollowUpReminderContextType,
);
