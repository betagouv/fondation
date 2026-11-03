import { Badge } from '@codegouvfr/react-dsfr/Badge';
import { Card } from '@codegouvfr/react-dsfr/Card';
import DocumentSearch from '@codegouvfr/react-dsfr/picto/DocumentSearch';
import JusticeScales from '@codegouvfr/react-dsfr/picto/JusticeScales';
import type { ComponentType } from 'react';
import { useIntl } from 'react-intl';

import { ROUTE_PATHS } from '@/utils/route-path.utils';

function CardPictogram(props: {
  pictogram: ComponentType<{ 'aria-hidden': boolean; className: string; height: string; width: string }>;
}) {
  return (
    <div className="flex h-44 items-center justify-center bg-(--background-alt-blue-france)">
      <props.pictogram aria-hidden className="fr-artwork" height="96" width="96" />
    </div>
  );
}

export const SecretariatGeneralPage = () => {
  const { formatMessage } = useIntl();

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
        <ul className="grid w-full max-w-4xl list-none gap-8 p-0 md:grid-cols-2">
          <li>
            <Card
              className="h-full"
              enlargeLink
              imageComponent={<CardPictogram pictogram={JusticeScales} />}
              linkProps={{ to: ROUTE_PATHS.SG.MANAGE_SESSION }}
              title={formatMessage({ defaultMessage: 'Pouvoir de proposition GDS' })}
              titleAs="h2"
            />
          </li>
          <li>
            <Card
              className="h-full"
              classes={{ footer: 'flex justify-end' }}
              footer={
                <Badge noIcon severity="info" small>
                  {formatMessage({ defaultMessage: 'En cours de développement' })}
                </Badge>
              }
              imageComponent={<CardPictogram pictogram={DocumentSearch} />}
              title={formatMessage({ defaultMessage: 'Pouvoir de proposition CSM' })}
              titleAs="h2"
            />
          </li>
        </ul>
      </div>
    </div>
  );
};
