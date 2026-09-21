import { FormattedMessage } from 'react-intl';

import { AlertBanner } from '@/shared/ui/alert-banner';

export function AgendaDraftBanner(props: { hasValidatedVersion: boolean }) {
  return (
    <AlertBanner
      className="fr-mt-4v px-4 py-3"
      icon="fr-icon-draft-line"
      message={
        props.hasValidatedVersion ? (
          <FormattedMessage defaultMessage="Brouillon en cours. Le document validé reste inchangé tant que vous n'avez pas validé celui-ci." />
        ) : (
          <FormattedMessage defaultMessage="Brouillon. Ce document ne sera disponible qu'une fois validé." />
        )
      }
      tone="info"
    />
  );
}
