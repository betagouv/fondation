import { FormattedMessage } from 'react-intl';

import { AlertBanner } from '@/shared/ui/alert-banner';

export function AuditionAnnouncedBanner(props: { className?: string; fullWidth?: boolean }) {
  return (
    <AlertBanner
      className={props.className}
      fullWidth={props.fullWidth}
      icon="fr-icon-speak-line"
      message={<FormattedMessage defaultMessage="Magistrat à convoquer en audition" />}
      tone="info"
    />
  );
}
