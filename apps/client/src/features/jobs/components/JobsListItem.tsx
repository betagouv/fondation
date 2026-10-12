import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import React from 'react';

import { formatJobDate } from '../utils/format-job-date.utils';
import { formatJobDuration } from '../utils/format-job-duration.utils';
import { JOB_STATUS_ICONS } from '../utils/job-status.utils';
import type { PaginatedJobsDto } from '@api/types';

export function JobsListItem(props: { job: PaginatedJobsDto['items'][number] }) {
  const { job } = props;

  const { icon, textColor } = React.useMemo(() => JOB_STATUS_ICONS[job.status], [job]);
  const startedAtFormatted = React.useMemo(() => formatJobDate(job.startedAt ?? job.createdAt), [job]);
  const duration = React.useMemo(() => (job.startedAt && job.endedAt ? formatJobDuration(job) : null), [job]);

  return (
    <div>
      <span className={clsx(icon, textColor, 'font-bold before:mr-2 before:size-5! before:content-[""]')}>
        Job #{job.id}
      </span>

      <span className="fr-mt-4v flex flex-col text-sm font-normal text-(--text-mention-grey)">
        {startedAtFormatted ? (
          <span
            className={clsx(
              cx('ri-calendar-line'),
              'flex items-center text-xs tabular-nums before:mr-1 before:size-4! before:content-[""]',
            )}
          >
            {startedAtFormatted}
          </span>
        ) : null}
        {duration ? (
          <span
            className={clsx(
              cx('ri-time-line'),
              'text-xs tabular-nums before:mr-1 before:size-4! before:align-middle before:content-[""]',
            )}
          >
            {duration}
          </span>
        ) : null}
      </span>
    </div>
  );
}
