import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import React from 'react';

import { formatJobDuration } from '../utils/format-job-duration.utils';
import { JOB_STATUS_ICONS } from '../utils/job-status.utils';
import type { Tree } from '../types/job.types';
import { useSelectedJob } from '../context/job.context';

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
        'hover:border-opacity-85 fr-p-4v cursor-pointer rounded-sm border border-solid bg-(--background-default-grey) text-sm transition-all duration-100 select-none',
        isSelected
          ? 'border-(--border-active-blue-france) shadow-sm hover:border-(--border-active-blue-france) hover:shadow-md'
          : 'border-(--border-default-grey) hover:border-(--border-active-blue-france) hover:shadow-sm',
      )}
    >
      <span className="flex items-center">
        <i
          className={clsx(
            props.node.status !== 'FAILED' && props.node.errors.length > 0
              ? ['text-(--text-default-warning)', cx('ri-error-warning-fill')]
              : [textColor, icon],
            'before:content-[""]',
            'before:size-4!',
            'before:align-middle',
            'fr-mr-1v',
          )}
        />
        <span>{props.node.name}</span>
      </span>
      <div className="fr-ml-5v flex flex-col">
        {duration ? <span className="text-xs text-(--text-mention-grey)">{duration}</span> : null}
      </div>
    </div>
  );
}
