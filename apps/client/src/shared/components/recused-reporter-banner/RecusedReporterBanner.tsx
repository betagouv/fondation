import { FormattedMessage } from 'react-intl';

import { AlertBanner } from '@/shared/ui/alert-banner';
import { useUser } from '@queries/auth.queries';

export function RecusedReporterBanner(props: { className?: string; fullWidth?: boolean }) {
  const { user } = useUser();

  return (
    <AlertBanner
      className={props.className}
      fullWidth={props.fullWidth}
      icon="fr-icon-info-fill"
      message={
        <FormattedMessage
          defaultMessage="Vous vous êtes {gender, select, FEMALE {déportée} other {déporté}} sur ce dossier"
          values={{ gender: user?.gender }}
        />
      }
      tone="info"
    />
  );
}
