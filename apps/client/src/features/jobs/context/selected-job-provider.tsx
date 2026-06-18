import React, { useState } from 'react';

import { JobContext } from './job.context';

export function SelectedJobProvider(props: React.PropsWithChildren) {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const selectFile = React.useCallback(
    (id: string | null) => setSelectedFileId((selected) => (selected === id ? null : id)),
    [setSelectedFileId],
  );

  return (
    <JobContext.Provider value={{ selectedFileId, toggleFile: selectFile }}>
      {props.children}
    </JobContext.Provider>
  );
}
