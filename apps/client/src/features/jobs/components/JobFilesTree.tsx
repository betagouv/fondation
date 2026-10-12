import React from 'react';

import { type JobFile } from '../types/job.types';
import { tree } from '../utils/tree.utils';

import { JobFileBranch } from './JobFilesBranch';

export function JobFilesTree(props: { files: readonly JobFile[] }) {
  const forest = React.useMemo(() => tree(props.files), [props.files]);

  return (
    <div className="fr-p-6v flex w-full flex-wrap gap-4 overflow-x-auto rounded-sm border border-solid border-(--border-default-grey) bg-(--background-contrast-grey)">
      {forest.map((tree) => (
        <JobFileBranch key={tree.id} tree={tree} root />
      ))}
    </div>
  );
}
