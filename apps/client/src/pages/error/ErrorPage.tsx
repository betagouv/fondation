import type { ButtonProps } from '@codegouvfr/react-dsfr/Button';
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { isRouteErrorResponse, useRouteError } from 'react-router';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { PageLayout } from '@/layout/PageLayout';
import { ErrorPageLayout } from '@/shared/ui/error-page';
import { appVersion } from '@/utils/app-version';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useUser } from '@queries/auth.queries';

export function ErrorPage() {
  const { user } = useUser();
  const isSg = useIsSg();
  const error = useRouteError();

  // a missing file resolves to nothing once its reload is decided: the page would flash before unloading
  if (appVersion.isReloading) return null;

  const buttons: ButtonProps[] = [];

  if (isSg) {
    buttons.push({
      priority: 'primary',
      children: 'Accueil',
      linkProps: { to: ROUTE_PATHS.SG.DASHBOARD },
    });
  } else if (user?.role) {
    buttons.push({
      priority: 'primary',
      children: 'Accueil',
      linkProps: {
        to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
      },
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
      href: `mailto:informatique.csm@justice.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    },
  });

  return (
    <PageLayout>
      <ErrorPageLayout>
        <h1>Erreur inattendue</h1>
        <p className={cx('fr-text--sm', 'fr-mb-6v')}>
          {isRouteErrorResponse(error) ? `Erreur ${error.status}` : 'Erreur applicative'}
        </p>
        <p className={cx('fr-text--lead', 'fr-mb-6v')}>
          Désolé, le service rencontre un problème, nous travaillons pour le résoudre le plus rapidement
          possible.
        </p>

        <p className={cx('fr-text--sm', 'fr-m-0')}>
          Essayez de rafraîchir la page ou bien ressayez plus tard.
        </p>
        <p className="fr-text--sm fr-mb-6v">
          Si vous avez besoin d'une aide immédiate, merci de nous contacter.
        </p>

        <ButtonsGroup inlineLayoutWhen="md and up" buttons={buttons as [ButtonProps, ...ButtonProps[]]} />
      </ErrorPageLayout>
    </PageLayout>
  );
}
