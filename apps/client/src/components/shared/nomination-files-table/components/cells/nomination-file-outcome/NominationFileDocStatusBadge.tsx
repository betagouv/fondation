import { colors } from '@codegouvfr/react-dsfr';
import Badge from '@codegouvfr/react-dsfr/Badge';
import { useIntl } from 'react-intl';

import type { UpdatableNominationFileStatusEnum } from '@/types/enums.types';

const bgColor = colors.decisions.artwork.background.purpleGlycine.default;
const textColor = colors.decisions.text.actionHigh.purpleGlycine.default;

export function NominationFileDocStatusBadge(props: { status: UpdatableNominationFileStatusEnum }) {
  const { formatMessage } = useIntl();
  const title =
    props.status === 'DSJ_REPORTED'
      ? formatMessage({ defaultMessage: 'PV de restitution' })
      : props.status === 'DSJ_PLANNED'
        ? formatMessage({ defaultMessage: `Ordre du jour` })
        : null;

  if (props.status === 'TO_REPORT') return null;

  const badgeProps = { title };
  return (
    <Badge
      noIcon
      as="span"
      small
      {...badgeProps}
      style={{ color: textColor, background: bgColor }}
      className="cursor-default"
    >
      {props.status === 'DSJ_PLANNED' ? 'ODJ' : 'PV'}
    </Badge>
  );
}
