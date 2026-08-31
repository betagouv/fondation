import { FormattedMessage } from 'react-intl';

import { AlertBanner } from '@/shared/ui/alert-banner';
import type { NominationSessionFileStatus } from '@/types/enums.types';
import { formatLongDateOnly } from '@/utils/date-only.util';

const NOTICE_LAYOUT = '-mx-8 px-8 py-4';

type FrozenFile = { isArchived: boolean; status: NominationSessionFileStatus };

function frozenMessage({ isArchived, status }: FrozenFile) {
  if (isArchived) {
    return <FormattedMessage defaultMessage="Session archivée : ce dossier n'est plus modifiable" />;
  }

  const [reportedOn] = status.dates;
  if (!reportedOn) {
    return (
      <FormattedMessage defaultMessage="Dossier acté dans un procès-verbal : il n'est plus modifiable" />
    );
  }

  return (
    <FormattedMessage
      defaultMessage="Dossier acté dans le PV du {date} : il n'est plus modifiable"
      values={{ date: formatLongDateOnly(reportedOn) }}
    />
  );
}

export function FrozenFileNotice(props: FrozenFile) {
  return (
    <AlertBanner
      align="center"
      className={NOTICE_LAYOUT}
      icon="fr-icon-lock-line"
      message={frozenMessage(props)}
      tone="neutral"
    />
  );
}
