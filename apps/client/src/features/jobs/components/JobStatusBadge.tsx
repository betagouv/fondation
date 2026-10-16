import Badge, { type BadgeProps } from '@codegouvfr/react-dsfr/Badge';
import { useIntl } from 'react-intl';

import { JobStatusEnumMessages, type JobStatusEnum } from '@/shared/enums/job-status.enum';
import { capitalize } from '@/utils/string.utils';

const SEVERITIES: Record<JobStatusEnum, BadgeProps['severity']> = {
  CANCELED: undefined,
  FAILED: 'error',
  IDLE: undefined,
  RUNNING: 'info',
  SUCCEEDED: 'success',
};

export function JobStatusBadge(props: { status: JobStatusEnum }) {
  const { formatMessage } = useIntl();

  return (
    <Badge as="span" noIcon={!SEVERITIES[props.status]} severity={SEVERITIES[props.status]} small>
      {capitalize(formatMessage(JobStatusEnumMessages[props.status]))}
    </Badge>
  );
}
