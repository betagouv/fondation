import React from 'react';

type JobContextType = {
  selectedFileId: string | null;
  toggleFile: (id: string | null) => void;
};

/** @internal */
export const JobContext = React.createContext<JobContextType>(null as unknown as JobContextType);

export function useSelectedJob(): JobContextType {
  const ctx = React.useContext(JobContext);
  if (!ctx) throw new Error('useJobContext must be used within a JobProvider');

  return ctx;
}
