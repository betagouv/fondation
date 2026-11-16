import Button from '@codegouvfr/react-dsfr/Button';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { FormattedMessage } from 'react-intl';
import { generatePath } from 'react-router';

import { ErrorPageLayout } from '@/shared/ui/error-page';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

export function OfficialReportNotFound(props: { sessionId: string }) {
  return (
    <ErrorPageLayout>
      <h1>
        <FormattedMessage defaultMessage="Procès-verbal introuvable" />
      </h1>
      <p className={cx('fr-text--sm', 'fr-mb-6v')}>
        <FormattedMessage defaultMessage="Erreur 404" />
      </p>
      <p className={cx('fr-text--lead', 'fr-mb-6v')}>
        <FormattedMessage defaultMessage="Le procès-verbal auquel vous tentez d'accéder n'existe pas ou a été supprimé." />
      </p>

      <Button
        linkProps={{ to: generatePath(ROUTE_PATHS.SG.SESSION_ID_DOCUMENTS, { sessionId: props.sessionId }) }}
      >
        <FormattedMessage defaultMessage="Documents de la session" />
      </Button>
    </ErrorPageLayout>
  );
}
