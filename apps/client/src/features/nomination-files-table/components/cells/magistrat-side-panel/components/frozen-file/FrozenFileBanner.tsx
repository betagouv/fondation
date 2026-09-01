import { FormattedMessage } from 'react-intl';

import { AlertBanner } from '@/shared/ui/alert-banner';
import type { NominationSessionFileStatus } from '@/types/enums.types';
import { formatLongDateOnly } from '@/utils/date-only.util';

const BANNER_LAYOUT = '-mx-8 px-8 py-4';

type FrozenFile = { isArchived: boolean; status: NominationSessionFileStatus };

function officialReportDate(status: NominationSessionFileStatus) {
  return status.value === 'DSJ_REPORTED' ? status.dates[0] : undefined;
}

function frozenMessage({ isArchived, status }: FrozenFile) {
  if (isArchived) {
    return <FormattedMessage defaultMessage="Session archivée : ce dossier n'est plus modifiable" />;
  }

  const reportedOn = officialReportDate(status);
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

export function FrozenFileBanner(props: FrozenFile) {
  return (
    <AlertBanner
      align="center"
      className={BANNER_LAYOUT}
      icon="fr-icon-lock-line"
      message={frozenMessage(props)}
      tone="neutral"
    />
  );
}
