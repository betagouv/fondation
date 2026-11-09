import type { ButtonProps } from '@codegouvfr/react-dsfr/Button';
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { useQueryClient } from '@tanstack/react-query';
import { defineMessage, FormattedMessage, useIntl, type MessageDescriptor } from 'react-intl';
import { isRouteErrorResponse, useLocation, useNavigate, useRouteError } from 'react-router';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { PageLayout } from '@/layout/PageLayout';
import { failureOf, type FailureReason } from '@/shared/hooks/useRequestFailure';
import { ErrorPageLayout } from '@/shared/ui/error-page';
import { appVersion } from '@/utils/app-version';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useUser } from '@queries/auth.queries';

// a slowdown or a dropped connection passes, a bug stays: only the first are worth retrying
const TRANSIENT_FAILURES: Readonly<
  Partial<Record<FailureReason, { lead: MessageDescriptor; title: MessageDescriptor }>>
> = {
  offline: {
    lead: defineMessage({
      defaultMessage:
        "Votre connexion au service a été coupée, sans doute à cause d'un problème passager de réseau.",
    }),
    title: defineMessage({ defaultMessage: 'La connexion a été interrompue' }),
  },
  timeout: {
    lead: defineMessage({
      defaultMessage:
        "Le service n'a pas répondu à temps, sans doute à cause d'un ralentissement passager du service ou de votre connexion.",
    }),
    title: defineMessage({ defaultMessage: 'Le chargement a pris trop de temps' }),
  },
  unavailable: {
    lead: defineMessage({
      defaultMessage: "Le service n'a pas pu répondre, sans doute à cause d'un ralentissement passager.",
    }),
    title: defineMessage({ defaultMessage: 'Le service est momentanément indisponible' }),
  },
};

export function ErrorPage() {
  const { formatMessage } = useIntl();
  const { user } = useUser();
  const isSg = useIsSg();
  const error = useRouteError();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // a missing file resolves to nothing once its reload is decided: the page would flash before unloading
  if (appVersion.isReloading) return null;

  const transientFailure = TRANSIENT_FAILURES[failureOf(error).reason];
  const isTransient = !!transientFailure;
  const homePriority = isTransient ? 'secondary' : 'primary';
  const buttons: ButtonProps[] = [];

  if (isTransient) {
    buttons.push({
      children: formatMessage({ defaultMessage: 'Réessayer' }),
      // the router clears a rendering error on a new location only: a revalidation without loaders keeps it
      onClick: async () => {
        await queryClient.resetQueries({ predicate: (query) => query.state.status === 'error' });
        await navigate(location, { replace: true, state: location.state });
      },
      priority: 'primary',
    });
  }

  if (isSg) {
    buttons.push({
      priority: homePriority,
      children: formatMessage({ defaultMessage: 'Accueil' }),
      linkProps: { to: ROUTE_PATHS.SG.DASHBOARD },
    });
  } else if (user?.role) {
    buttons.push({
      priority: homePriority,
      children: formatMessage({ defaultMessage: 'Accueil' }),
      linkProps: {
        to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
      },
    });
  }

  const subject = formatMessage({ defaultMessage: 'Fondation - sollicitation utilisateur' });
  const body = formatMessage({
    defaultMessage:
      "NOTICE: Merci de préciser dans quel contexte l'anomalie s'est produite, si possible merci de rajouter une capture d'écran dans votre remontée, cela nous facilitera le traitement de votre anomalie dans les plus brefs délais.",
  });

  buttons.push({
    priority: 'secondary',
    children: formatMessage({ defaultMessage: 'Contactez-nous' }),
    linkProps: {
      href: `mailto:informatique.csm@justice.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    },
  });

  return (
    <PageLayout>
      <ErrorPageLayout>
        {transientFailure ? (
          <>
            <h1>{formatMessage(transientFailure.title)}</h1>
            <p className={cx('fr-text--lead', 'fr-mb-6v')}>{formatMessage(transientFailure.lead)}</p>
            <p className="fr-text--sm fr-mb-6v">
              <FormattedMessage defaultMessage="Réessayez dans quelques instants. Si le problème persiste, merci de nous contacter." />
            </p>
          </>
        ) : (
          <>
            <h1>
              <FormattedMessage defaultMessage="Erreur inattendue" />
            </h1>
            <p className={cx('fr-text--sm', 'fr-mb-6v')}>
              {isRouteErrorResponse(error) ? (
                <FormattedMessage defaultMessage="Erreur {status}" values={{ status: error.status }} />
              ) : (
                <FormattedMessage defaultMessage="Erreur applicative" />
              )}
            </p>
            <p className={cx('fr-text--lead', 'fr-mb-6v')}>
              <FormattedMessage defaultMessage="Désolé, le service rencontre un problème, nous travaillons pour le résoudre le plus rapidement possible." />
            </p>

            <p className={cx('fr-text--sm', 'fr-m-0')}>
              <FormattedMessage defaultMessage="Essayez de rafraîchir la page ou bien ressayez plus tard." />
            </p>
            <p className="fr-text--sm fr-mb-6v">
              <FormattedMessage defaultMessage="Si vous avez besoin d'une aide immédiate, merci de nous contacter." />
            </p>
          </>
        )}

        <ButtonsGroup inlineLayoutWhen="md and up" buttons={buttons as [ButtonProps, ...ButtonProps[]]} />
      </ErrorPageLayout>
    </PageLayout>
  );
}
