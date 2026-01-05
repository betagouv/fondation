import { useQueryState } from 'nuqs';
import React from 'react';

import { type Magistrat } from 'shared-models';
import type { SessionNominationFile } from '../../../../react-query/mutations/sg/nomination-session-affectations';

import { MagistratDetails } from './MagistratDetails';

export type MagistratDetailsProps = {
  formation: Magistrat.Formation;
  nominationFile: SessionNominationFile;
};

export function MagistratRouteDetails(props: {
  formation: Magistrat.Formation;
  nominationFiles: readonly SessionNominationFile[];
}) {
  const [activeNominationFileId] = useQueryState('active');

  const activeNominationFile = React.useMemo(
    () => props.nominationFiles.find((f) => f.id === activeNominationFileId) ?? null,
    [props.nominationFiles, activeNominationFileId]
  );

  if (!activeNominationFile) return null;

  return <MagistratDetails formation={props.formation} nominationFile={activeNominationFile} />;
}
