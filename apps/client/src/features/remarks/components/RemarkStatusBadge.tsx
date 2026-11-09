import Badge, { type BadgeProps } from '@codegouvfr/react-dsfr/Badge';
import { useIntl } from 'react-intl';

import { type RemarkStatusEnum, RemarkStatusEnumMessages } from '@/shared/enums/remark-status.enum';

const SEVERITIES: Record<RemarkStatusEnum, BadgeProps['severity']> = {
  ACKNOWLEDGED: 'warning',
  DISMISSED: undefined,
  NEW: 'info',
  PROCESSED: 'success',
};

export function RemarkStatusBadge(props: { status: RemarkStatusEnum }) {
  const { formatMessage } = useIntl();

  return (
    <Badge
      as="span"
      className="w-34 justify-center text-[0.8125rem]!"
      noIcon
      severity={SEVERITIES[props.status]}
      small
    >
      {formatMessage(RemarkStatusEnumMessages[props.status])}
    </Badge>
  );
}
