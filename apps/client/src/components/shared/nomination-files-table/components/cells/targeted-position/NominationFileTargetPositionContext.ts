import React from 'react';

import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

type NominationFileTargetPositionContextType = {
  nominationFile: SessionNominationFile | null;
  setNominationFile: (file: SessionNominationFile | null) => void;
};

export const NominationFileTargetPositionContext = React.createContext(
  null as unknown as NominationFileTargetPositionContextType,
);
