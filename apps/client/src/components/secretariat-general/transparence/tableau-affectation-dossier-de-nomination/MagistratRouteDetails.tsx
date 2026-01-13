import { useQueryState } from 'nuqs';
import React from 'react';

import { MagistratDetails } from './MagistratDetails';
import type { FormationEnum } from '@/types/enums.types';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

export type MagistratDetailsProps = {
  formation: FormationEnum;
  nominationFile: SessionNominationFile;
};

export function MagistratRouteDetails(props: {
  sessionId: string;
  formation: FormationEnum;
  nominationFiles: readonly SessionNominationFile[];
}) {
  const [activeNominationFileId] = useQueryState('active');

  const activeNominationFile = React.useMemo(
    () => props.nominationFiles.find((f) => f.id === activeNominationFileId) ?? null,
    [props.nominationFiles, activeNominationFileId]
  );

  if (!activeNominationFile) return null;

  return (
    <MagistratDetails
      sessionId={props.sessionId}
      formation={props.formation}
      nominationFile={activeNominationFile}
    />
  );
}
