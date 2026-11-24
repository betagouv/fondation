import Button from '@codegouvfr/react-dsfr/Button';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { FormattedMessage } from 'react-intl';

import { ErrorPageLayout } from '@/shared/ui/error-page';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

export function MemberNotFound() {
  return (
    <ErrorPageLayout>
      <h1>
        <FormattedMessage defaultMessage="Membre introuvable" />
      </h1>
      <p className={cx('fr-text--sm', 'fr-mb-6v')}>
        <FormattedMessage defaultMessage="Erreur 404" />
      </p>
      <p className={cx('fr-text--lead', 'fr-mb-6v')}>
        <FormattedMessage defaultMessage="Le membre que vous cherchez n'existe pas ou n'a plus de compte dans Fondation." />
      </p>

      <Button linkProps={{ to: ROUTE_PATHS.SG.MANAGE_MEMBERS }}>
        <FormattedMessage defaultMessage="Liste des membres" />
      </Button>
    </ErrorPageLayout>
  );
}
