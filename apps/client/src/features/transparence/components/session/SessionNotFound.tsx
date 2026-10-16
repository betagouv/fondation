import Button from '@codegouvfr/react-dsfr/Button';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { FormattedMessage } from 'react-intl';

import { ErrorPageLayout } from '@/shared/ui/error-page';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

export function SessionNotFound() {
  return (
    <ErrorPageLayout>
      <h1>
        <FormattedMessage defaultMessage="Session introuvable" />
      </h1>
      <p className={cx('fr-text--sm', 'fr-mb-6v')}>
        <FormattedMessage defaultMessage="Erreur 404" />
      </p>
      <p className={cx('fr-text--lead', 'fr-mb-6v')}>
        <FormattedMessage defaultMessage="La session à laquelle vous tentez d'accéder n'existe pas ou ne relève pas de votre formation." />
      </p>

      <Button linkProps={{ to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD }}>
        <FormattedMessage defaultMessage="Page d'accueil" />
      </Button>
    </ErrorPageLayout>
  );
}
