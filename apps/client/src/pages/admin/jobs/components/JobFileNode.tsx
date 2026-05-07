import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import React from 'react';

import { formatJobDuration } from '../common/format-job-duration.utils';
import { JOB_STATUS_ICONS } from '../common/job-status.utils';
import type { Tree } from '../common/job.types';
import { useSelectedJob } from '../contexts/job.context';

export function JobFileNode(props: { node: Omit<Tree, 'children'> }) {
  const { icon, textColor } = React.useMemo(() => {
    if (props.node.status === 'SUCCEEDED' && props.node.errors.length > 0) {
      return JOB_STATUS_ICONS.WARNING;
    }

    return JOB_STATUS_ICONS[props.node.status];
  }, [props.node]);
  const duration = React.useMemo(
    () =>
      formatJobDuration({
        startedAt: props.node.startedAt,
        endedAt: props.node.endedAt ?? new Date().toISOString(),
      }),
    [props.node],
  );

  const { selectedFileId, toggleFile } = useSelectedJob();
  const isSelected = selectedFileId === props.node.id;

  return (
    <div
      role="button"
      onClick={() => toggleFile(props.node.id)}
      className={clsx(
        'hover:border-opacity-85 cursor-pointer rounded-sm border border-solid bg-white p-4 text-sm transition-all duration-100 select-none',
        isSelected
          ? 'border-blue-500 shadow-sm hover:border-blue-600 hover:shadow-md'
          : 'border-gray-300 hover:border-blue-400 hover:shadow-sm',
      )}
    >
      <span className="flex items-center">
        <i
          className={clsx(
            props.node.status !== 'FAILED' && props.node.errors.length > 0
              ? ['text-orange-500', cx('ri-error-warning-fill')]
              : [textColor, icon],
            'before:content-[""]',
            'before:size-4!',
            'before:align-middle',
            'mr-1',
          )}
        />
        <span>{props.node.name}</span>
      </span>
      <div className="ml-5 flex flex-col">
        {duration ? <span className="text-xs text-gray-500">{duration}</span> : null}
      </div>
    </div>
  );
}
