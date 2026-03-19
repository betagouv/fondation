import type { ButtonProps } from '@codegouvfr/react-dsfr/Button';
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import TechnicalError from '@codegouvfr/react-dsfr/picto/TechnicalError';

import { useUser } from '@queries/auth.queries';

import { PageLayout } from '@/components/layout/PageLayout';
import { OvoidBackground, OvoidMotif } from '@/components/shared/ovoid';
import { useIsSg } from '@/hooks/roles.hook';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

export function AppErrorBoundary() {
  const { user } = useUser();
  const isSg = useIsSg();

  const buttons: ButtonProps[] = [];

  if (isSg) {
    buttons.push({
      priority: 'primary',
      children: 'Accueil',
      linkProps: { to: ROUTE_PATHS.SG.DASHBOARD }
    });
  } else if (user?.role) {
    buttons.push({
      priority: 'primary',
      children: 'Accueil',
      linkProps: {
        to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD
      }
    });
  }

  const subject = `Fondation - sollicitation utilisateur`;
  const body =
    `NOTICE: Merci de préciser dans quel contexte l'anomalie s'est produite, ` +
    `si possible merci de rajouter une capture d'écran dans votre remontée, ` +
    `cela nous facilitera le traitement de votre anomalie dans les plus brefs délais.`;

  buttons.push({
    priority: 'secondary',
    children: 'Contactez-nous',
    linkProps: {
      href: `mailto:informatique.csm@justice.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    }
  });

  return (
    <PageLayout>
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
            <h1>Erreur inattendue</h1>
            <p className={cx('fr-text--sm', 'fr-mb-3w')}>Erreur 500</p>
            <p className={cx('fr-text--lead', 'fr-mb-3w')}>
              Désolé, le service rencontre un problème, nous travaillons pour le résoudre le plus rapidement
              possible.
            </p>

            <p className={cx('fr-text--sm', 'fr-m-0')}>
              Essayez de rafraîchir la page ou bien ressayez plus tard.
            </p>
            <p className="fr-text--sm fr-mb-3w">
              Si vous avez besoin d'une aide immédiate, merci de nous contacter.
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
    </PageLayout>
  );
}
