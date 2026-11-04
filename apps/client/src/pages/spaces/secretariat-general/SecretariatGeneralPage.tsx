import { Badge } from '@codegouvfr/react-dsfr/Badge';
import { Card } from '@codegouvfr/react-dsfr/Card';
import DocumentSearch from '@codegouvfr/react-dsfr/picto/DocumentSearch';
import JusticeScales from '@codegouvfr/react-dsfr/picto/JusticeScales';
import type { ComponentType } from 'react';
import { useIntl } from 'react-intl';

import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useCountUsersNewSessionsQuery } from '@queries/nomination-sessions.queries';

function CardPictogram(props: {
  pictogram: ComponentType<{ 'aria-hidden': boolean; className: string; height: string; width: string }>;
  size: string;
}) {
  return (
    <div className="flex h-40 items-center justify-center bg-(--background-alt-blue-france) pt-8">
      <props.pictogram aria-hidden className="fr-artwork" height={props.size} width={props.size} />
    </div>
  );
}

export const SecretariatGeneralPage = () => {
  const { formatMessage } = useIntl();
  const { data } = useCountUsersNewSessionsQuery();
  const newSessionsCount = data?.count ?? 0;

  return (
    <div className="grow bg-linear-to-br from-(--blue-france-925-125) to-(--blue-france-925-125-hover)">
      <div className="fr-container flex flex-col items-center gap-12 py-24">
        <div className="text-center">
          <h1 className="fr-h3 text-(--text-title-blue-france)">
            {formatMessage({ defaultMessage: 'Bienvenue sur Fondation' })}
          </h1>
          <p className="fr-text--lg fr-mb-0">
            {formatMessage({ defaultMessage: 'Sur quel pouvoir souhaitez-vous travailler ?' })}
          </p>
        </div>
        <ul className="grid w-full max-w-3xl list-none gap-6 p-0 md:grid-cols-2">
          <li>
            <Card
              badge={
                newSessionsCount > 0 ? (
                  <Badge severity="new" small>
                    {formatMessage(
                      {
                        defaultMessage:
                          '{count, plural, one {# nouvelle session} other {# nouvelles sessions}}',
                      },
                      { count: newSessionsCount },
                    )}
                  </Badge>
                ) : undefined
              }
              className="h-full"
              classes={{ content: 'pt-6! pb-22!' }}
              enlargeLink
              imageComponent={<CardPictogram pictogram={JusticeScales} size="80" />}
              linkProps={{ to: ROUTE_PATHS.SG.MANAGE_SESSION, viewTransition: true }}
              title={formatMessage({ defaultMessage: 'Pouvoir de proposition GDS' })}
              titleAs="h2"
            />
          </li>
          <li>
            <Card
              badge={
                <Badge noIcon severity="info" small>
                  {formatMessage({ defaultMessage: 'En cours de développement' })}
                </Badge>
              }
              className="h-full"
              classes={{ content: 'pt-6!' }}
              imageComponent={<CardPictogram pictogram={DocumentSearch} size="72" />}
              title={formatMessage({ defaultMessage: 'Pouvoir de proposition CSM' })}
              titleAs="h2"
            />
          </li>
        </ul>
      </div>
    </div>
  );
};
