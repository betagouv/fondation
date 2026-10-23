import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router';

import { JobFilesList } from '@/features/jobs/components/JobFilesList';
import { JobStatusBadge } from '@/features/jobs/components/JobStatusBadge';
import { bySeverity } from '@/features/jobs/utils/by-severity.utils';
import { formatJobDuration } from '@/features/jobs/utils/format-job-duration.utils';
import { SeverityEnumCountMessages } from '@/shared/enums/severity.enum';
import { useDateAndTime } from '@/shared/hooks/useDateAndTime';
import { useDetailsJobQuery } from '@queries/jobs.queries';

export function AdminJobDetailsPage() {
  const { formatMessage } = useIntl();
  const dateAndTime = useDateAndTime();
  const params = useParams<{ jobId: string }>();
  const jobId = parseInt(String(params.jobId), 10);
  const { data: job, isLoading } = useDetailsJobQuery({ jobId });

  if (isLoading) {
    return (
      <p className="text-(--text-mention-grey)">
        <FormattedMessage defaultMessage="Chargement..." />
      </p>
    );
  }

  if (!job) {
    return (
      <p className="text-(--text-mention-grey)">
        <FormattedMessage defaultMessage="Ingestion introuvable" />
      </p>
    );
  }

  const duration = formatJobDuration(job);

  return (
    <div className="flex flex-col gap-y-6">
      <div>
        <h2 className="fr-h4 fr-mb-2v flex flex-wrap items-center gap-3">
          <FormattedMessage
            defaultMessage="Ingestion du {date} à {time}"
            values={dateAndTime(job.startedAt ?? job.createdAt)}
          />
          <JobStatusBadge status={job.status} />
        </h2>
        {duration && (
          <p className="fr-text--sm fr-mb-0 text-(--text-mention-grey)">
            <FormattedMessage defaultMessage="Durée : {duration}" values={{ duration }} />
          </p>
        )}
      </div>

      <section>
        <h3 className="fr-h6 fr-mb-2v">
          <FormattedMessage defaultMessage="Fichiers" />
        </h3>
        <JobFilesList files={job.files} />
      </section>

      {bySeverity(job.messages).map(({ messages, severity }) => (
        <section key={severity}>
          <h3 className="fr-h6 fr-mb-2v">
            {formatMessage(SeverityEnumCountMessages[severity], { count: messages.length })}
          </h3>
          {messages.map(({ text }, i) => (
            <pre
              className="fr-p-4v overflow-x-auto rounded-sm bg-(--background-contrast-grey) font-mono text-sm wrap-break-word whitespace-pre-wrap"
              key={`job_${job.id}_${severity}_${i}`}
            >
              {text}
            </pre>
          ))}
        </section>
      ))}
    </div>
  );
}
