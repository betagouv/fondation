import type { ButtonProps } from '@codegouvfr/react-dsfr/Button';
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { useContext } from 'react';
import { FormattedMessage } from 'react-intl';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { SummaryContext } from '@/features/summary/context/SummaryContext';
import { ErrorPageLayout } from '@/shared/ui/error-page';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

export function SummaryNotFound() {
  const { sessionId } = useContext(SummaryContext);
  const isSg = useIsSg();

  const buttons: ButtonProps[] = [];

  if (isSg) {
    buttons.push({
      children: <FormattedMessage defaultMessage="Liste des propositions" />,
      linkProps: { to: ROUTE_PATHS.SG.SESSION_ID.replace(':sessionId', sessionId) },
      priority: 'primary',
    });
  } else {
    buttons.push({
      children: <FormattedMessage defaultMessage="Liste des dossiers" />,
      linkProps: {
        to: {
          pathname: ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS.replace(':sessionId', sessionId),
          search: '?focus=general',
        },
      },
      priority: 'primary',
    });
  }

  buttons.push({
    children: <FormattedMessage defaultMessage="Page d'accueil" />,
    linkProps: { to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD },
    priority: buttons.length ? 'secondary' : 'primary',
  });

  return (
    <ErrorPageLayout>
      <h1>
        <FormattedMessage defaultMessage="Pas de synthèse disponible" />
      </h1>
      <p className={cx('fr-text--sm', 'fr-mb-6v')}>
        <FormattedMessage defaultMessage="Erreur 404" />
      </p>
      <p className={cx('fr-text--lead', 'fr-mb-6v')}>
        <FormattedMessage defaultMessage="La synthèse à laquelle vous tentez d'accéder n'existe probablement plus." />
      </p>

      <ButtonsGroup buttons={buttons as [ButtonProps, ...ButtonProps[]]} inlineLayoutWhen="md and up" />
    </ErrorPageLayout>
  );
}
