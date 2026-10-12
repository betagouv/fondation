import type { ButtonProps } from '@codegouvfr/react-dsfr/Button';
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import TechnicalError from '@codegouvfr/react-dsfr/picto/TechnicalError';
import { useContext } from 'react';
import { FormattedMessage } from 'react-intl';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { SummaryContext } from '@/features/summary/context/SummaryContext';
import { OvoidBackground, OvoidMotif } from '@/shared/ui/ovoid';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

/** @see https://www.systeme-de-design.gouv.fr/version-courante/fr/modeles/pages-types/page-d-erreurs */
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
    <div className="fr-container">
      <div
        className={cx(
          'fr-my-14v',
          'fr-mt-md-24v',
          'fr-mb-md-20v',
          'fr-grid-row',
          'fr-grid-row--gutters',
          'fr-grid-row--middle',
          'fr-grid-row--center',
        )}
      >
        <div className={cx('fr-py-0', 'fr-col-12', 'fr-col-md-6')}>
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
        </div>

        <div
          className={cx(
            'fr-col-12',
            'fr-col-md-3',
            'fr-col-offset-md-1',
            'fr-px-12v',
            'fr-px-md-0',
            'fr-py-0',
          )}
        >
          <div className="relative h-50 w-40">
            <OvoidMotif className="absolute" />
            <OvoidBackground className="fr-artwork-background absolute" />

            <TechnicalError
              aria-hidden
              className="fr-artwork fr-responsive-img absolute"
              height="100"
              width="80"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
