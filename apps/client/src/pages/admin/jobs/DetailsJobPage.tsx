import { useMemo } from 'react';
import { useOutletContext, useParams } from 'react-router';
import type { JobsPageOutletContextType } from './jobs-page-outlet-context.type';
import { JOB_STATUS_ICONS } from './jobs.constants';

export function DetailsJobPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = parseInt(String(params.jobId), 10);
  const { status } = useOutletContext<JobsPageOutletContextType>();

  const { icon, textColor } = useMemo(() => JOB_STATUS_ICONS[status ?? 'IDLE'], [status]);

  return (
    <div className="mt-7">
      <h1 className="fr-h3">
        <i
          className={`${icon} before:mr-2 before:size-6 before:align-middle before:content-[""] ${textColor}`}
        />
        <span>Job #{jobId}</span>
      </h1>
    </div>
  );
}
