import type { ButtonProps } from '@codegouvfr/react-dsfr/Button';
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import TechnicalError from '@codegouvfr/react-dsfr/picto/TechnicalError';
import { useContext } from 'react';

import { OvoidBackground, OvoidMotif } from '@/components/shared/ovoid';
import { useIsSg } from '@/hooks/roles.hook';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { SummaryContext } from './SummaryContext';

/** @see https://www.systeme-de-design.gouv.fr/version-courante/fr/modeles/pages-types/page-d-erreurs */
export function SummaryNotFound() {
  const { sessionId } = useContext(SummaryContext);
  const isSg = useIsSg();

  const buttons: ButtonProps[] = [];

  if (isSg) {
    buttons.push({
      priority: 'primary',
      children: 'Liste des propositions',
      linkProps: { to: ROUTE_PATHS.SG.SESSION_ID.replace(':sessionId', sessionId) }
    });
  } else {
    buttons.push({
      priority: 'primary',
      children: 'Liste des dossiers',
      linkProps: {
        to: {
          pathname: ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS.replace(':sessionId', sessionId),
          search: '?focus=general'
        }
      }
    });
  }

  buttons.push({
    priority: buttons.length ? 'secondary' : 'primary',
    children: "Page d'accueil",
    linkProps: { to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD }
  });

  return (
    <div className="fr-container">
      <div
        className={cx(
          'fr-my-7w',
          'fr-mt-md-12w',
          'fr-mb-md-10w',
          'fr-grid-row',
          'fr-grid-row--gutters',
          'fr-grid-row--middle',
          'fr-grid-row--center'
        )}
      >
        <div className={cx('fr-py-0', 'fr-col-12', 'fr-col-md-6')}>
          <h1>Pas de synthèse disponible</h1>
          <p className={cx('fr-text--sm', 'fr-mb-3w')}>Erreur 404</p>
          <p className={cx('fr-text--lead', 'fr-mb-3w')}>
            La synthèse à laquelle vous tentez d'accéder n'existe probablement plus.
          </p>

          <ButtonsGroup inlineLayoutWhen="md and up" buttons={buttons as [ButtonProps, ...ButtonProps[]]} />
        </div>

        <div
          className={cx(
            'fr-col-12',
            'fr-col-md-3',
            'fr-col-offset-md-1',
            'fr-px-6w',
            'fr-px-md-0',
            'fr-py-0'
          )}
        >
          <div className="relative h-[200px] w-40">
            <OvoidMotif className="absolute" />
            <OvoidBackground className="fr-artwork-background absolute" />

            <TechnicalError
              aria-hidden
              width="80"
              height="100"
              className="fr-artwork fr-responsive-img absolute"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
