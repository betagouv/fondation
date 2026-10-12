import clsx from 'clsx';
import React from 'react';

import type { Tree } from '../types/job.types';

import { JobFileNode } from './JobFileNode';

export function JobFileBranch(props: { tree: Tree; root?: boolean }) {
  return (
    <div
      className={clsx(
        'flex shrink flex-col items-center gap-2 2xl:flex-row',
        props.root &&
          props.tree.size > 1 &&
          'fr-p-2v rounded-sm border border-dashed border-(--border-default-grey) xl:border-none xl:p-0',
      )}
    >
      <JobFileNode node={props.tree} />
      {props.tree.children.map((subTree) => (
        <React.Fragment key={subTree.id}>
          <span className="inline 2xl:hidden">↑</span>
          <span className="hidden 2xl:inline">←</span>
          <JobFileBranch tree={subTree} />
        </React.Fragment>
      ))}
    </div>
  );
}
