import { useQueryState } from 'nuqs';
import React from 'react';

import type { SessionNominationFile } from '@queries/nomination-sessions.queries';
import { MagistratDetails } from './MagistratDetails';

export type MagistratDetailsProps = {
  nominationFile: SessionNominationFile;
};

export function MagistratRouteDetails(props: {
  sessionId: string;
  nominationFiles: readonly SessionNominationFile[];
}) {
  const [activeNominationFileId] = useQueryState('active');

  const activeNominationFile = React.useMemo(
    () => props.nominationFiles.find((f) => f.id === activeNominationFileId) ?? null,
    [props.nominationFiles, activeNominationFileId]
  );

  if (!activeNominationFile) return null;

  return <MagistratDetails sessionId={props.sessionId} nominationFile={activeNominationFile} />;
}
