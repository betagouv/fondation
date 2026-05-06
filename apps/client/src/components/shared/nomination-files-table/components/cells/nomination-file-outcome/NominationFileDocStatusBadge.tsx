import { colors } from '@codegouvfr/react-dsfr';
import Badge from '@codegouvfr/react-dsfr/Badge';
import { useIntl } from 'react-intl';

import type { UpdatableNominationFileStatusEnum } from '@/types/enums.types';

const bgColor = colors.decisions.artwork.background.purpleGlycine.default;
const textColor = colors.decisions.text.actionHigh.purpleGlycine.default;

export function NominationFileDocStatusBadge(props: {
  status: UpdatableNominationFileStatusEnum;
  docs: {
    isLinkedToAgenda: boolean;
    isLinkedToOfficialReport: boolean;
    isLinkedToPresentationPlan: boolean;
  };
}) {
  const { formatMessage } = useIntl();
  const title = props.docs.isLinkedToOfficialReport
    ? formatMessage({ defaultMessage: 'PV de restitution' })
    : props.docs.isLinkedToPresentationPlan
      ? formatMessage({ defaultMessage: `Notice de restitution` })
      : formatMessage({ defaultMessage: 'Ordre du jour' });

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
      DOC
    </Badge>
  );
}
