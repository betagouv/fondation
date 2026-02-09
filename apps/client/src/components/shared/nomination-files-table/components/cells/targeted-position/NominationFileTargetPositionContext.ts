import type { SessionNominationFile } from '@queries/nomination-sessions.queries';
import React from 'react';

type NominationFileTargetPositionContextType = {
  nominationFile: SessionNominationFile | null;
  setNominationFile: (file: SessionNominationFile | null) => void;
};

export const NominationFileTargetPositionContext = React.createContext(
  null as unknown as NominationFileTargetPositionContextType
);
