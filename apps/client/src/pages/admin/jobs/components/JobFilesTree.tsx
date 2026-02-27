import React from 'react';
import { type JobFile } from '../common/job.types';
import { tree } from '../common/tree.utils';
import { JobFileBranch } from './JobFilesBranch';

export function JobFilesTree(props: { files: readonly JobFile[] }) {
  const forest = React.useMemo(() => tree(props.files), [props.files]);

  return (
    <div className="flex w-full flex-wrap gap-4 overflow-x-auto rounded border border-solid border-gray-300 bg-gray-100 p-6">
      {forest.map((tree) => (
        <JobFileBranch key={tree.id} tree={tree} root />
      ))}
    </div>
  );
}
