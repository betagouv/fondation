import { useIntl } from 'react-intl';

import type { UpdatableNominationFileStatusEnum } from '@/types/enums.types';

import { NominationFileDocStatusBadge } from './nomination-file-outcome/NominationFileDocStatusBadge';

export function NominationFileStatusCell(props: { status: UpdatableNominationFileStatusEnum }) {
  const { formatMessage } = useIntl();

  if (props.status === 'TO_REPORT') return formatMessage({ defaultMessage: 'En attente' });

  return <NominationFileDocStatusBadge status={props.status} />;
}
