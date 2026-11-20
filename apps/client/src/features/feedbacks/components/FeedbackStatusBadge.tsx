import Badge, { type BadgeProps } from '@codegouvfr/react-dsfr/Badge';
import { useIntl } from 'react-intl';

import { type FeedbackStatusEnum, FeedbackStatusEnumMessages } from '@/shared/enums/feedback-status.enum';

const SEVERITIES: Record<FeedbackStatusEnum, BadgeProps['severity']> = {
  ACKNOWLEDGED: 'info',
  DISMISSED: undefined,
  NEW: 'new',
  PROCESSED: 'success',
};

export const FEEDBACK_STATUS_BADGE_COLORS: Record<FeedbackStatusEnum, string> = {
  ACKNOWLEDGED: 'bg-(--background-contrast-info) text-(--text-default-info)',
  DISMISSED: 'bg-(--background-contrast-grey-hover) text-(--text-default-grey)',
  NEW: 'bg-(--background-contrast-yellow-moutarde) text-(--text-action-high-yellow-moutarde)',
  PROCESSED: 'bg-(--background-contrast-success) text-(--text-default-success)',
};

export function FeedbackStatusBadge(props: { status: FeedbackStatusEnum }) {
  const { formatMessage } = useIntl();

  return (
    <Badge as="span" className="whitespace-nowrap" noIcon severity={SEVERITIES[props.status]} small>
      {formatMessage(FeedbackStatusEnumMessages[props.status])}
    </Badge>
  );
}
