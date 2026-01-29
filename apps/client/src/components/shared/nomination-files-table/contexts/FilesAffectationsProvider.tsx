import type { SessionNominationFile } from '@queries/nomination-sessions.queries';
import React from 'react';
import { FilesAffectationsContext, useAffectationsModel } from './files-affectations.context';

export function FilesAffectationsProvider(
  props: React.PropsWithChildren<{ files: SessionNominationFile[] }>
) {
  const value = useAffectationsModel(props.files);
  return <FilesAffectationsContext value={value}>{props.children}</FilesAffectationsContext>;
}
