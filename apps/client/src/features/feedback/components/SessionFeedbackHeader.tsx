import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath } from 'react-router';

import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { DetailsHeader } from '@/shared/ui/details';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

export function SessionFeedbackHeader(props: {
  context: 'membre' | 'sg';
  session: { id: string; name: string };
}) {
  const { formatMessage } = useIntl();
  const sessionPath = generatePath(
    props.context === 'sg' ? ROUTE_PATHS.SG.SESSION_ID : ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS,
    { sessionId: props.session.id },
  );

  const segments =
    props.context === 'sg'
      ? [
          { label: formatMessage({ defaultMessage: 'Secrétariat général' }), to: ROUTE_PATHS.SG.DASHBOARD },
          {
            label: formatMessage({ defaultMessage: 'Gérer une session' }),
            to: ROUTE_PATHS.SG.MANAGE_SESSION,
          },
          { label: props.session.name, to: sessionPath },
        ]
      : [
          {
            label: formatMessage({ defaultMessage: 'Transparences' }),
            to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
          },
          {
            label: formatMessage({ defaultMessage: 'Pouvoir de proposition du garde des Sceaux' }),
            to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
          },
          { label: props.session.name, to: sessionPath },
        ];

  return (
    <DetailsHeader
      backTo={sessionPath}
      breadcrumb={
        <Breadcrumb
          ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane de l'avis sur une session" })}
          breadcrumb={{ currentPageLabel: formatMessage({ defaultMessage: 'Mon avis' }), segments }}
          className="fr-mt-0"
          id="session-feedback-breadcrumb"
        />
      }
      description={
        <FormattedMessage defaultMessage="Quelques questions sur votre travail avec Fondation pendant cette session. Votre nom n'apparaît pas dans les résultats. Vos réponses servent à améliorer l'outil." />
      }
      overline={<FormattedMessage defaultMessage="Votre avis sur la session" />}
      title={props.session.name}
    />
  );
}
