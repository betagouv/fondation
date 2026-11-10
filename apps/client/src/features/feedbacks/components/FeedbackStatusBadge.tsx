import Badge, { type BadgeProps } from '@codegouvfr/react-dsfr/Badge';
import { useIntl } from 'react-intl';

import { type FeedbackStatusEnum, FeedbackStatusEnumMessages } from '@/shared/enums/feedback-status.enum';

const SEVERITIES: Record<FeedbackStatusEnum, BadgeProps['severity']> = {
  ACKNOWLEDGED: 'info',
  DISMISSED: undefined,
  NEW: 'new',
  PROCESSED: 'success',
};

export function FeedbackStatusBadge(props: { status: FeedbackStatusEnum }) {
  const { formatMessage } = useIntl();

  return (
    <Badge as="span" className="whitespace-nowrap" noIcon severity={SEVERITIES[props.status]} small>
      {formatMessage(FeedbackStatusEnumMessages[props.status])}
    </Badge>
  );
}
